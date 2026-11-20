const db = require('../config/database');

const publicFields = `
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.is_active,
  u.created_at,
  u.updated_at,
  r.code AS role,
  r.name AS role_name
`;

async function findByEmail(email) {
  const result = await db.query(
    `
      SELECT ${publicFields}, u.password_hash
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await db.query(
    `
      SELECT ${publicFields}
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function createCitizen({ email, passwordHash, firstName, lastName, phone }) {
  const result = await db.query(
    `
      INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone)
      SELECT r.id, LOWER($1), $2, $3, $4, $5
      FROM roles r
      WHERE r.code = 'CIUDADANO'
      RETURNING id
    `,
    [email, passwordHash, firstName, lastName, phone || null]
  );

  return findById(result.rows[0].id);
}

async function updateProfile(id, fields) {
  const updates = [];
  const values = [id];

  if (Object.prototype.hasOwnProperty.call(fields, 'firstName')) {
    values.push(fields.firstName);
    updates.push(`first_name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(fields, 'lastName')) {
    values.push(fields.lastName);
    updates.push(`last_name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(fields, 'phone')) {
    values.push(fields.phone || null);
    updates.push(`phone = $${values.length}`);
  }

  if (updates.length === 0) {
    return findById(id);
  }

  const result = await db.query(
    `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  return findById(id);
}

async function listAll() {
  const result = await db.query(
    `
      SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.email,
        u.phone,
        u.is_active AS active,
        r.code AS "roleCode",
        r.name AS role,
        u.created_at AS "createdAt",
        COALESCE(ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), '{}') AS "categoryIds",
        COALESCE(ARRAY_AGG(DISTINCT c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS "categoryNames"
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      LEFT JOIN technician_categories tc ON tc.technician_id = u.id
      LEFT JOIN report_categories c ON c.id = tc.category_id
      GROUP BY u.id, r.code, r.name
      ORDER BY u.created_at ASC, u.id ASC
    `
  );
  return result.rows;
}

async function listTechnicians(categoryId = null) {
  const result = await db.query(
    `
      SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.email,
        u.phone,
        u.is_active AS active,
        STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS specialty,
        COALESCE(ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), '{}') AS "categoryIds",
        COALESCE(ARRAY_AGG(DISTINCT c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS "categoryNames",
        COUNT(DISTINCT report.id) FILTER (WHERE report.status IN ('ASIGNADO', 'EN_PROCESO'))::INTEGER AS workload,
        COUNT(DISTINCT report.id) FILTER (WHERE report.status IN ('ASIGNADO', 'EN_PROCESO') AND report.priority = 'CRITICA')::INTEGER AS "criticalWorkload"
      FROM users u
      INNER JOIN roles role ON role.id = u.role_id
      INNER JOIN technician_categories tc ON tc.technician_id = u.id
      INNER JOIN report_categories c ON c.id = tc.category_id
      LEFT JOIN reports report ON report.assigned_to = u.id
      WHERE role.code = 'TECNICO'
        AND u.is_active = TRUE
        AND ($1::int IS NULL OR EXISTS (
          SELECT 1 FROM technician_categories match_tc
          WHERE match_tc.technician_id = u.id AND match_tc.category_id = $1
        ))
      GROUP BY u.id
      ORDER BY workload ASC, u.first_name, u.last_name
    `,
    [categoryId]
  );
  return result.rows;
}

async function createManaged({ firstName, lastName, email, passwordHash, phone, active, categoryIds }) {
  const client = await db.pool.connect();
  let userId;
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `
        INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active)
        SELECT r.id, LOWER($1), $2, $3, $4, $5, $6
        FROM roles r
        WHERE r.code = 'TECNICO'
        RETURNING id
      `,
      [email, passwordHash, firstName, lastName, phone || null, active]
    );
    userId = result.rows[0].id;
    await client.query(
      `INSERT INTO technician_categories (technician_id, category_id)
       SELECT $1, id FROM report_categories WHERE id = ANY($2::int[])`,
      [userId, categoryIds]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return findById(userId);
}

async function setActive(id, active) {
  const result = await db.query(
    `UPDATE users SET is_active = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
    [id, active]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
}

module.exports = {
  findByEmail,
  findById,
  createCitizen,
  updateProfile,
  listAll,
  listTechnicians,
  createManaged,
  setActive
};
