import cron from "node-cron";
import { db } from "../db";
import { getRecentMessages } from "../repositories/messageRepository";
import { summarizeEmails } from "./openai";
import { sendEmail } from "./nylas";

export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    const users = db.prepare(`
      SELECT *
      FROM users
      WHERE destination_email IS NOT NULL
    `).all() as any[];

    for (const user of users) {
      try {
        const lastRun = user.last_summary_at
          ? new Date(user.last_summary_at)
          : new Date(0);

        const now = new Date();

        let intervalMs = 60 * 60 * 1000;

if (user.cadence === "every_6_hours") {
  intervalMs = 6 * 60 * 60 * 1000;
}

if (user.cadence === "daily") {
  intervalMs = 24 * 60 * 60 * 1000;
}

const shouldRun =
  now.getTime() - lastRun.getTime() >= intervalMs;

        if (!shouldRun) continue;

        const windowStart = lastRun.toISOString();
        const windowEnd = now.toISOString();

        const inserted = db.prepare(`
          INSERT OR IGNORE INTO summary_runs
          (grant_id, window_start, window_end)
          VALUES (?, ?, ?)
        `).run(user.grant_id, windowStart, windowEnd);

        if (inserted.changes === 0) continue;

        const messages = getRecentMessages(user.grant_id);
        const summary = await summarizeEmails(messages);

        await sendEmail(
          user.grant_id,
          user.destination_email,
          "Scheduled AI Inbox Summary",
          `<pre>${summary}</pre>`
        );

        db.prepare(`
          UPDATE users
          SET last_summary_at = ?
          WHERE grant_id = ?
        `).run(windowEnd, user.grant_id);

        console.log(`Scheduled summary sent to ${user.destination_email}`);
      } catch (error) {
        console.error("Scheduler error:", error);
      }
    }
  });
}
