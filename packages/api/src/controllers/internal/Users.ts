import { Controller, Middleware, Post } from "@overnightjs/core";
import type { Request, Response } from "express";
import { NotFound } from "../../exceptions";
import { isValidInternalSecretKey } from "../../middleware/auth";
import { UserService } from "../../services/UserService";

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
}
