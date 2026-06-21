import { db } from "../db";

export type StoredMessage = {
  message_id: string;
  grant_id: string;
  sender?: string;
  subject?: string;
  snippet?: string;
  received_at?: string;
  is_read?: boolean;
};

export function saveMessage(message: StoredMessage) {
  db.prepare(`
    INSERT OR IGNORE INTO messages
    (message_id, grant_id, sender, subject, snippet, received_at, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    message.message_id,
    message.grant_id,
    message.sender ?? null,
    message.subject ?? null,
    message.snippet ?? null,
    message.received_at ?? null,
    message.is_read ? 1 : 0
  );
}

export function getRecentMessages(grantId: string) {
  return db.prepare(`
    SELECT * FROM messages
    WHERE grant_id = ?
    ORDER BY received_at DESC
    LIMIT 20
  `).all(grantId);
}

export function getAllMessages(grantId: string) {
  return db.prepare(`
    SELECT *
    FROM messages
    WHERE grant_id = ?
    ORDER BY received_at DESC
  `).all(grantId);
}

export function getMessageById(messageId: string) {
  return db.prepare(`
    SELECT *
    FROM messages
    WHERE message_id = ?
  `).get(messageId);
}
