const promotionalSenders = [
  "skims",
  "victoriassecret",
  "zillow",
  "kohls",
  "duolingo",
];

export function filterRelevantEmails(messages: any[]) {
  return messages.filter((message) => {
    const sender = String(message.sender ?? "").toLowerCase();
    const subject = String(message.subject ?? "").toLowerCase();

    const isPromotional = promotionalSenders.some(
      (keyword) =>
        sender.includes(keyword) || subject.includes(keyword)
    );

    return !isPromotional;
  });
}
