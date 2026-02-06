import { Request, Response, NextFunction } from 'express'; 
import * as memberService from '../services/member-services.js';

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { search, member_code } = req.query;

		const members = await memberService.getAllMembers(
			search as string | undefined,
			member_code as string | undefined
		);

		res.status(200).json({
			count: members.length,
			members: members
		});
	} catch (error) {
		next(error);
	}
};

export const createMember = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { member_code, member_name, email, phone, address } = req.body;

		if (!member_code || !member_name || !email || !phone || !address) {
			return res.status(400).json({ error: 'All fields are required: member_code, member_name, email, phone, address' });
		}

		const member = await memberService.createMember(member_code, member_name, email, phone, address);

		res.status(201).json({
			message: 'Member created successfully',
			member: member
		});
	} catch (error: any) {
		if (error.code === '23505') {
			return res.status(409).json({ error: 'Member code or email already exists' });
		}
		next(error);
	}
};
