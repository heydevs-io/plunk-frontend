import { Controller, Middleware, Post } from "@overnightjs/core";
import type { Request, Response } from "express";
import { HttpException, NotFound } from "../../exceptions";
import { isValidInternalSecretKey } from "../../middleware/auth";
import { UserService } from "../../services/UserService";
import { UserSchemas } from "@plunk/shared";
import { prisma } from "../../database/prisma";
import { createHash } from "../../util/hash";

@Controller("users")
export class Users {
	@Post()
	@Middleware([isValidInternalSecretKey])
	public async getUserByEmail(req: Request, res: Response) {
		const { email } = req.body;

		const user = await UserService.email(email);
		if (!user) {
			throw new NotFound('user');
		}

		return res.status(200).json({
			id: user.id,
			email: user.email,
		});
	}

	@Post("create")
	@Middleware([isValidInternalSecretKey])
	public async signup(req: Request, res: Response) {
		const { email, password } = UserSchemas.credentials.parse(req.body);

		const user = await UserService.email(email);

		if (user) {
			throw new HttpException(400, "That email is already associated with another user");
		}

		const created_user = await prisma.user.create({
			data: {
				email,
				password: await createHash(password),
			},
		});

		return res.json({ id: created_user.id, email: created_user.email });
	}
}
