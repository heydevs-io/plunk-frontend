import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { ContactSchemas, UtilitySchemas } from "@plunk/shared";
import csv from "csv-parser";
import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import z from "zod";
import { prisma } from "../../database/prisma";
import { HttpException, NotFound } from "../../exceptions";
import { type IKey, type ISecret, isValidKey, isValidSecretKey } from "../../middleware/auth";
import { ActionService } from "../../services/ActionService";
import { ContactService } from "../../services/ContactService";
import { EventService } from "../../services/EventService";
import { ProjectService } from "../../services/ProjectService";
import { Keys } from "../../services/keys";
import { redis } from "../../services/redis";

const upload = multer({ dest: "uploads/" });

@Controller("contacts")
export class Contacts {
	@Get("count")
	@Middleware([isValidKey])
	public async getContactCount(req: Request, res: Response) {
		const { key } = res.locals.auth as IKey;

		const project = await ProjectService.key(key);

		if (!project) {
			throw new NotFound("project");
		}

		const count = await ProjectService.contacts.count(project.id);

		return res.status(200).json({ count });
	}

	@Get(":id")
	public async getContactById(req: Request, res: Response) {
		const { id } = UtilitySchemas.id.parse(req.params);
		const { withProject } = z
			.object({
				withProject: z
					.boolean()
					.default(false)
					.or(z.string().transform((s) => s === "true")),
			})
			.parse(req.query);

		const contact = await ContactService.id(id);

		if (!contact) {
			throw new NotFound("contact");
		}

		if (withProject) {
			const project = await ProjectService.id(contact.projectId);

			if (!project) {
				throw new NotFound("project");
			}

			return res.status(200).json({
				...contact,
				project: { name: project.name, public: project.public },
			});
		}
		return res.status(200).json(contact);
	}

	@Get()
	@Middleware([isValidSecretKey])
	public async getContacts(req: Request, res: Response) {
		const { sk } = res.locals.auth as ISecret;

		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		const contacts = await ProjectService.contacts.get(project.id);

		return res.status(200).json(
			contacts?.map((c) => {
				return {
					id: c.id,
					email: c.email,
					subscribed: c.subscribed,
					data: c.data,
					createdAt: c.createdAt,
					updatedAt: c.updatedAt,
				};
			}),
		);
	}

	@Post("unsubscribe")
	@Middleware([isValidKey])
	public async unsubscribe(req: Request, res: Response) {
		const { key } = res.locals.auth as IKey;

		const project = await ProjectService.key(key);

		if (!project) {
			throw new NotFound("project");
		}

		const { id, email } = ContactSchemas.manage.parse(req.body);

		let contact = id ? await ContactService.id(id) : await ContactService.email(project.id, email as string);

		if (!contact || contact.projectId !== project.id) {
			throw new NotFound("contact");
		}

		contact = await prisma.contact.update({
			where: { id: contact.id },
			data: { subscribed: false },
		});

		let event = await EventService.event(project.id, "unsubscribe");

		if (!event) {
			event = await prisma.event.create({
				data: { name: "unsubscribe", projectId: project.id },
			});

			await redis.del(Keys.Project.events(project.id, true));
			await redis.del(Keys.Project.events(project.id, false));
			await redis.del(Keys.Event.event(project.id, event.name));
			await redis.del(Keys.Event.id(event.id));
		}

		await prisma.trigger.create({
			data: { eventId: event.id, contactId: contact.id },
		});
		await redis.del(Keys.Contact.id(contact.id));

		await ActionService.trigger({ event, contact, project });

		await redis.del(Keys.Project.contacts(project.id));
		await redis.del(Keys.Contact.id(contact.id));
		await redis.del(Keys.Contact.email(project.id, contact.email));

		return res.status(200).json({ success: true, contact: contact.id, subscribed: false });
	}

	@Post("subscribe")
	@Middleware([isValidKey])
	public async subscribe(req: Request, res: Response) {
		const { key } = res.locals.auth as IKey;

		const project = await ProjectService.key(key);

		if (!project) {
			throw new NotFound("project");
		}

		const { id, email } = ContactSchemas.manage.parse(req.body);

		let contact = id ? await ContactService.id(id) : await ContactService.email(project.id, email as string);

		if (!contact || contact.projectId !== project.id) {
			throw new NotFound("contact");
		}

		contact = await prisma.contact.update({
			where: { id: contact.id },
			data: { subscribed: true },
		});

		let event = await EventService.event(project.id, "subscribe");

		if (!event) {
			event = await prisma.event.create({
				data: { name: "subscribe", projectId: project.id },
			});

			await redis.del(Keys.Project.events(project.id, true));
			await redis.del(Keys.Project.events(project.id, false));
			await redis.del(Keys.Event.event(project.id, event.name));
			await redis.del(Keys.Event.id(event.id));
		}

		await prisma.trigger.create({
			data: { eventId: event.id, contactId: contact.id },
		});
		await redis.del(Keys.Contact.id(contact.id));

		await ActionService.trigger({ event, contact, project });

		await redis.del(Keys.Project.contacts(project.id));
		await redis.del(Keys.Contact.id(contact.id));
		await redis.del(Keys.Contact.email(project.id, contact.email));

		return res.status(200).json({ success: true, contact: contact.id, subscribed: true });
	}

	@Post()
	@Middleware([isValidSecretKey])
	public async createContact(req: Request, res: Response) {
		const { sk } = res.locals.auth as ISecret;

		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		const { email, subscribed, data } = ContactSchemas.create.parse(req.body);

		let contact = await ContactService.email(project.id, email);

		if (contact) {
			throw new HttpException(409, "Contact already exists");
		}

		contact = await prisma.contact.create({
			data: {
				projectId: project.id,
				email,
				subscribed,
				data: data ? JSON.stringify(data) : null,
			},
		});

		await redis.del(Keys.Project.contacts(project.id));
		await redis.del(Keys.Contact.id(contact.id));
		await redis.del(Keys.Contact.email(project.id, email));

		return res.status(200).json({
			success: true,
			id: contact.id,
			email: contact.email,
			subscribed: contact.subscribed,
			data: contact.data,
			createdAt: contact.createdAt,
			updatedAt: contact.updatedAt,
		});
	}

	@Post("import")
	@Middleware([isValidSecretKey])
	public async importContacts(req: Request, res: Response, next: NextFunction) {
		const { sk } = res.locals.auth as ISecret;
		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		upload.single("file")(req, res, async (err: any) => {
			if (err) {
				return res.status(400).json({ error: "File upload failed" });
			}

			const file = req.file;

			// Check if the file is undefined or not
			if (!file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			const contacts: any[] = [];

			fs.createReadStream(file.path)
				.pipe(csv())
				.on("data", (row) => {
					contacts.push(row);
				})
				.on("end", async () => {
					// Define the type for the result object
					const result: {
						success: { email: string }[];
						failed: { email?: string; row?: any; error: string }[];
					} = {
						success: [],
						failed: [],
					};

          // Email validation regex
          const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

					for (const row of contacts) {
						try {
							const {
								first_name,
								last_name,
								gender,
								email,
								phone_code,
								phone,
								contact_type,
							} = row;

							if (!email) {
								result.failed.push({ row, error: "Email is required" });
								continue;
							}

              if (!emailRegex.test(email)) {
                result.failed.push({ row, error: "Invalid email format" });
                continue;
              }

							let contact = await ContactService.email(project.id, email);

							if (contact) {
								result.failed.push({ email, error: "Contact already exists" });
								continue;
							}

							// Handle missing values (e.g., phone_code and phone)
							const sanitizedPhoneCode = phone_code ? phone_code.trim() : null;
							const sanitizedPhone = phone ? phone.trim() : null;
							const sanitizedFirstName = first_name ? first_name.trim() : null;
							const sanitizedLastName = last_name ? last_name.trim() : null;
							const sanitizedGender = gender ? gender.trim() : null;
							const sanitizedContactType = contact_type
								? contact_type.trim()
								: null;

							// Create contact
							contact = await prisma.contact.create({
								data: {
									projectId: project.id,
									email,
									data: JSON.stringify({
										firstName: sanitizedFirstName,
										lastName: sanitizedLastName,
										gender: sanitizedGender,
										phoneCode: sanitizedPhoneCode,
										phone: sanitizedPhone,
										contactType: sanitizedContactType,
									}),
								},
							});

							result.success.push({ email });

							// Clear cache
							await redis.del(Keys.Project.contacts(project.id));
							await redis.del(Keys.Contact.id(contact.id));
							await redis.del(Keys.Contact.email(project.id, email));
						} catch (error) {
							// Use a type guard to check if error is an instance of Error
							if (error instanceof Error) {
								result.failed.push({ email: row.email, error: error.message });
							} else {
								result.failed.push({
									email: row.email,
									error: "An unknown error occurred",
								});
							}
						}
					}

					fs.unlinkSync(file.path); // Clean up the file
					return res.status(200).json(result);
				});
		});
	}

	@Put()
	@Middleware([isValidSecretKey])
	public async updateContact(req: Request, res: Response) {
		const { sk } = res.locals.auth as ISecret;

		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		const { id, email, subscribed, data } = ContactSchemas.manage.parse(req.body);

		const contact = id ? await ContactService.id(id) : await ContactService.email(project.id, email as string);

		if (!contact || contact.projectId !== project.id) {
			throw new NotFound("contact");
		}

		if (data) {
			const givenUserData = Object.entries(data);
			const dataToUpdate = JSON.parse(contact.data ?? "{}");

			givenUserData.forEach(([key, value]) => {
				if (!value) {
					delete dataToUpdate[key];
				} else {
					dataToUpdate[key] = value;
				}
			});

			await prisma.contact.update({
				where: { id: contact.id },
				data: { data: JSON.stringify(dataToUpdate) },
			});
		}

		await prisma.contact.update({
			where: { id: contact.id },
			data: {
				email,
				subscribed: subscribed ?? contact.subscribed,
			},
		});

		await redis.del(Keys.Project.contacts(project.id));
		await redis.del(Keys.Contact.id(contact.id));
		await redis.del(Keys.Contact.email(project.id, contact.email));

		return res.status(200).json({
			success: true,
			id: contact.id,
			email: contact.email,
			subscribed: contact.subscribed,
			data: contact.data,
			createdAt: contact.createdAt,
			updatedAt: contact.updatedAt,
		});
	}

	@Put("bulk-update")
	@Middleware([isValidSecretKey])
	public async bulkUpdateContacts(req: Request, res: Response) {
		const { sk } = res.locals.auth as ISecret;

		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		const { contactIds, updateData } = z.object({
			contactIds: z.array(z.string()),
			updateData: z.object({
				contactType: z.string().optional(),
				gender: z.string().optional(),
			}),
		}).parse(req.body);

		if (Object.keys(updateData).length === 0) {
			throw new HttpException(400, "No update data provided");
		}

		const updatedContacts = await prisma.$transaction(async (tx) => {
			return Promise.all(
				contactIds.map(async (id) => {
					const contact = await tx.contact.findUnique({
						where: { id, projectId: project.id },
						select: { data: true },
					});
					
					if (!contact) {
						throw new NotFound(`Contact with id ${id} not found`);
					}

					const existingData = JSON.parse(contact.data || '{}');
					const newData = { ...existingData, ...updateData };

					return tx.contact.update({
						where: { id, projectId: project.id },
						data: { data: JSON.stringify(newData) },
					});
				})
			);
		});

		// Clear cache for updated contacts
		await Promise.all(
			updatedContacts.map(async (contact) => {
				await redis.del(Keys.Contact.id(contact.id));
				await redis.del(Keys.Contact.email(project.id, contact.email));
			})
		);

		await redis.del(Keys.Project.contacts(project.id));

		return res.status(200).json({
			success: true,
			updatedContacts,
		});
	}

	@Delete()
	@Middleware([isValidSecretKey])
	public async deleteContact(req: Request, res: Response) {
		const { sk } = res.locals.auth as ISecret;

		const project = await ProjectService.secret(sk);

		if (!project) {
			throw new NotFound("project");
		}

		const { id } = UtilitySchemas.id.parse(req.body);

		const contact = await ContactService.id(id);

		if (!contact || contact.projectId !== project.id) {
			throw new NotFound("contact");
		}

		await prisma.contact.delete({ where: { id } });

		await redis.del(Keys.Project.contacts(project.id));
		await redis.del(Keys.Contact.id(contact.id));
		await redis.del(Keys.Contact.email(project.id, contact.email));

		return res.status(200).json({
			success: true,
			id: contact.id,
			email: contact.email,
			subscribed: contact.subscribed,
			data: contact.data,
			createdAt: contact.createdAt,
			updatedAt: contact.updatedAt,
		});
	}
}