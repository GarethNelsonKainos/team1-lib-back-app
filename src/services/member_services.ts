import pool from "../config/db-conn.js";

export async function getAllMembers(search?: string, memberCode?: string) {
	let query = `
		SELECT member_id, member_code, member_name, email, phone, address, created_at, updated_at
		FROM members
		WHERE deleted_at IS NULL
	`;
	const params: string[] = [];

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

export async function getMemberById(id: string) {
	const query = `
		SELECT member_id, member_code, member_name, email, phone, address, created_at, updated_at
		FROM members
		WHERE member_id = $1 AND deleted_at IS NULL
	`;

	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
}

export async function deleteMember(id: string) {
	const query = `
		UPDATE members
		SET deleted_at = NOW()
		WHERE member_id = $1 AND deleted_at IS NULL
		RETURNING member_id, member_code, member_name, email, phone, address, created_at, updated_at, deleted_at
	`;

	const result = await pool.query(query, [id]);
	return result.rows[0] || null;
}
