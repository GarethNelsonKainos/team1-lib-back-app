import pool from "../config/db-conn.js";

export async function getAllMembers(search?: string, memberCode?: string) {
	let query = `
		SELECT member_id, member_code, member_name, email, phone, address, created_at, updated_at
		FROM members
		WHERE deleted_at IS NULL
	`;
	const params: any[] = [];

	if (search) {
		query += ` AND member_name ILIKE $${params.length + 1}`;
		params.push(`%${search}%`);
	}

	if (memberCode) {
		query += ` AND member_code = $${params.length + 1}`;
		params.push(memberCode);
	}

	query += ` ORDER BY member_name ASC`;

	const result = await pool.query(query, params);
	return result.rows;
}

export async function createMember(memberCode: string, memberName: string, email: string, phone: string, address: string) {
	const query = `
		INSERT INTO members (member_code, member_name, email, phone, address)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`;

	const result = await pool.query(query, [memberCode, memberName, email, phone, address]);
	return result.rows[0];
}
