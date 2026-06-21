import { filterRelevantEmails } from "./emailFilter";

export async function summarizeEmails(messages: any[]) {
  const relevantMessages = filterRelevantEmails(messages);
  const selectedMessages =
    relevantMessages.length > 0 ? relevantMessages : messages;

  const important = selectedMessages
    .slice(0, 10)
    .map((m, index) => {
      return `${index + 1}. From: ${m.sender}
Subject: ${m.subject}
Preview: ${m.snippet}`;
    })
    .join("\n\n");

  return `Inbox Summary

Important messages:
${important}

Suggested next actions:
- Reply to human senders first.
- Review anything with deadlines, school, work, interviews, or payments.
- Ignore obvious promotional emails unless they are personally relevant.

Filtered out ${messages.length - selectedMessages.length} likely promotional emails.`;
}
