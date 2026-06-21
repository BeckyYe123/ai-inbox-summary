import { db } from "../db";

export function saveGrant(
  grantId: string,
  email?: string
) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO users
    (grant_id,email)
    VALUES (?,?)
  `);

  stmt.run(grantId, email ?? null);
}

