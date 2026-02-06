import { Request, Response, NextFunction } from 'express'; 
import * as memberService from '../services/member_services.js';

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

export const getMemberById = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		const idString = Array.isArray(id) ? id[0] : id;
		

		const memberId = parseInt(idString, 10);
		if (isNaN(memberId)) {
			return res.status(400).json({ error: 'Invalid member ID' });
		}

		const member = await memberService.getMemberById(memberId.toString());

		if (!member) {
			return res.status(404).json({ error: 'Member not found' });
		}

		res.status(200).json({
			member: member
		});
	} catch (error) {
		next(error);
	}
};

export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		const idString = Array.isArray(id) ? id[0] : id;
		const memberId = parseInt(idString, 10);
		if (isNaN(memberId)) {
			return res.status(400).json({ error: 'Invalid member ID' });
		}

		const deletedMember = await memberService.deleteMember(memberId.toString());

		if (!deletedMember) {
			return res.status(404).json({ error: 'Member not found' });
		}

		res.status(200).json({
			message: 'Member deleted successfully',
			member: deletedMember
		});
	} catch (error) {
		next(error);
	}
};
