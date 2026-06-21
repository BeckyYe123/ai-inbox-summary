import { startScheduler } from "./services/scheduler";
import express from "express";
import { config } from "./config";
import { db } from "./db";

import {
  exchangeCodeForGrant,
  getAccount,
  fetchInboxMessages,
  sendEmail,
} from "./services/nylas";

import { summarizeEmails } from "./services/openai";

import {
  saveMessage,
  getRecentMessages,
  getAllMessages,
  getMessageById,
} from "./repositories/messageRepository";

import { saveGrant } from "./repositories/userRepository";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  const user = db
    .prepare("SELECT grant_id, email FROM users LIMIT 1")
    .get() as any;

  if (!user) {
    return res.send(`
      <h1>AI Inbox Summary</h1>
      <p>No mailbox connected yet.</p>
      <a href="/connect">Connect Gmail</a>
    `);
  }

  const grantId = user.grant_id;
  const email = user.email || "Connected mailbox";
  const totalEmails =
  db.prepare("SELECT COUNT(*) as count FROM messages").get() as any;

const unreadEmails =
  db.prepare("SELECT COUNT(*) as count FROM messages WHERE is_read = 0").get() as any;

const promoEmails =
  db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE sender LIKE '%zillow%'
       OR sender LIKE '%victoriassecret%'
       OR sender LIKE '%duolingo%'
       OR sender LIKE '%kohls%'
       OR sender LIKE '%skims%'
  `).get() as any;

  res.send(`
<html>
<head>
<title>AI Inbox Summary Dashboard</title>
<style>
body {
  font-family: Arial, sans-serif;
  background: #f4f6f9;
  padding: 40px;
}

.card {
  background: white;
  max-width: 800px;
nano src/index.ts  margin: auto;
  padding: 32px;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

h1 {
  color: #2563eb;
}

.button {
  display: block;
  margin: 16px 0;
  padding: 14px 18px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  width: fit-content;
}

.secondary {
  background: #374151;
}
</style>
</head>

<body>
  <div class="card">
    <h1> AI Inbox Summary</h1>
    <p><strong>Connected:</strong> ${email}</p>
    <div style="
  background:#f8fafc;
  padding:20px;
  border-radius:12px;
  margin:20px 0;
">
  <h3> Inbox Summary</h3>
  <p>Total Emails: ${totalEmails.count}</p>
  <p>Unread Emails: ${unreadEmails.count}</p>
  <p>Likely Promotions: ${promoEmails.count}</p>
  <p>
    Filter Rate:
    ${
      totalEmails.count > 0
        ? Math.round((promoEmails.count / totalEmails.count) * 100)
        : 0
    }%
  </p>
</div>

    <a class="button" href="/sync/${grantId}">Sync Inbox</a>
    <a class="button" href="/summary/${grantId}">Generate Summary</a>
    <a class="button" href="/priority/${grantId}">Smart Priority Inbox</a>
    <a class="button secondary" href="/send-summary/${grantId}?to=dongyanye7@gmail.com">Email Summary</a>
  </div>
</body>
</html>
  `);
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/connect", (_req, res) => {
  const url =
    `https://api.us.nylas.com/v3/connect/auth` +
    `?client_id=${config.nylasClientId}` +
    `&redirect_uri=${encodeURIComponent(config.nylasCallbackUri)}` +
    `&response_type=code`;

  res.redirect(url);
});

app.get("/oauth/callback", async (req, res) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const tokenResponse = await exchangeCodeForGrant(code);
    const grantId = tokenResponse.grant_id || tokenResponse.grantId;

    saveGrant(grantId);

    res.send(`
      <h1>Connected Successfully</h1>
      <p>Grant ID: ${grantId}</p>
    `);
  } catch (error) {
    console.error("Sync error:", JSON.stringify((error as any).response?.data ?? error, null, 2));
    res.status(500).send("OAuth exchange failed");
  }
});

app.get("/sync/:grantId", async (req, res) => {
  try {
    const grantId = req.params.grantId;

    const messages = await fetchInboxMessages(grantId);

    for (const msg of messages) {
      saveMessage({
        message_id: msg.id,
        grant_id: grantId,
        sender: msg.from?.[0]?.email || "",
        subject: msg.subject || "",
        snippet: msg.snippet || "",
        received_at: msg.date
          ? new Date(msg.date * 1000).toISOString()
          : null,
        is_read: msg.unread === false,
      });
    }

    res.json({
      synced: messages.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Sync failed");
  }
});

app.get("/priority/:grantId", async (req, res) => {
  const grantId = req.params.grantId;

  const messages = getAllMessages(grantId) as any[];

  const actionRequired = messages.filter(
    m =>
      m.subject?.toLowerCase().includes("interview") ||
      m.subject?.toLowerCase().includes("deadline") ||
      m.subject?.toLowerCase().includes("payment") ||
      m.subject?.toLowerCase().includes("invoice")
  );

  const promotionalKeywords = [
  "zillow",
  "victoriassecret",
  "duolingo",
  "kohls",
  "skims",
  "etsy",
  "swarovski",
  "calvinklein",
  "newsletter",
  "promo",
  "offers",
  "deals",
  "sale",
  "discount",
];

const promotional = messages.filter((m) => {
  const sender = String(m.sender || "").toLowerCase();
  const subject = String(m.subject || "").toLowerCase();

  return (
    promotionalKeywords.some((keyword) =>
      sender.includes(keyword) || subject.includes(keyword)
    ) ||
    subject.includes("off") ||
    subject.includes("price cut") ||
    subject.includes("limited") ||
    subject.includes("shop")
  );
});

  const important = messages.filter(
    m =>
      !actionRequired.includes(m) &&
      !promotional.includes(m)
  );

  res.send(`
  <html>
  <body style="
    font-family:Arial;
    max-width:1000px;
    margin:auto;
    padding:40px;
  ">
  
  <h1> AI Priority Inbox</h1>
<div style="
  display:flex;
  gap:16px;
  margin:24px 0;
">
  <div style="flex:1;padding:18px;background:#fee2e2;border-radius:12px;">
    <h3>Action Required</h3>
    <p style="font-size:28px;font-weight:bold;">${actionRequired.length}</p>
  </div>

  <div style="flex:1;padding:18px;background:#fef3c7;border-radius:12px;">
    <h3>Important</h3>
    <p style="font-size:28px;font-weight:bold;">${important.length}</p>
  </div>

  <div style="flex:1;padding:18px;background:#dcfce7;border-radius:12px;">
    <h3>Promotional</h3>
    <p style="font-size:28px;font-weight:bold;">${promotional.length}</p>
  </div>
</div>
  

  <h2>🔴 Action Required (${actionRequired.length})</h2>

  ${actionRequired
  .map(
    m => `
      <div style="
        padding:16px;
        border:1px solid #ddd;
        border-radius:10px;
        margin:12px 0;
        background:white;
      ">
        <strong>${m.subject}</strong><br>
        <span>${m.sender}</span>

        <p>${m.snippet || ""}</p>

        <a
  href="/email/${m.message_id}"
  style="
    padding:8px 12px;
    background:#2563eb;
    color:white;
    text-decoration:none;
    border-radius:6px;
  "
>
  Open
</a>
        <button disabled>Archive</button>
        <button disabled>Delete</button>
      </div>
    `
  )
  .join("")}

  <h2>🟡 Important (${important.length})</h2>

  ${important
    .slice(0,5)
    .map(
      m => `
  <div style="
    padding:16px;
    border:1px solid #ddd;
    border-radius:10px;
    margin:12px 0;
    background:white;
  ">
    <strong>${m.subject}</strong><br>
    <span>${m.sender}</span>

    <p>${m.snippet || ""}</p>

    <a
  href="/email/${m.message_id}"
  style="
    padding:8px 12px;
    background:#2563eb;
    color:white;
    text-decoration:none;
    border-radius:6px;
    display:inline-block;
  "
>
  Open
</a>
    <button disabled>Archive</button>
    <button disabled>Delete</button>
  </div>
`

)
  .join("")}

  <h2>🟢 Promotional (${promotional.length})</h2>

  ${promotional
    .slice(0,5)
    .map(
      m => `
  <div style="
    padding:16px;
    border:1px solid #ddd;
    border-radius:10px;
    margin:12px 0;
    background:white;
  ">
    <strong>${m.subject}</strong><br>
    <span>${m.sender}</span>

    <p>${m.snippet || ""}</p>

    <a
  href="/email/${m.message_id}"
  style="
    padding:8px 12px;
    background:#2563eb;
    color:white;
    text-decoration:none;
    border-radius:6px;
    display:inline-block;
  "
>
  Open
</a>
    <button disabled>Archive</button>
    <button disabled>Delete</button>
  </div>
`
    )
    .join("")}

  </body>
  </html>
  `);
});

app.get("/email/:messageId", (req, res) => {
  const message = getMessageById(
    req.params.messageId
  ) as any;

  if (!message) {
    return res.status(404).send("Email not found");
  }

  res.send(`
  <html>
  <head>
    <title>${message.subject}</title>

    <style>
      body{
        font-family:Arial;
        background:#f4f6f9;
        padding:40px;
      }

      .card{
        max-width:900px;
        margin:auto;
        background:white;
        padding:30px;
        border-radius:12px;
      }
    </style>
  </head>

  <body>

    <div class="card">

      <h1>${message.subject}</h1>

      <p>
        <strong>From:</strong>
        ${message.sender}
      </p>

      <p>
        <strong>Received:</strong>
        ${message.received_at}
      </p>

      <hr>

      <p>
        ${message.snippet || "No preview available"}
      </p>

    </div>

  </body>
  </html>
  `);
});

app.get("/summary/:grantId", async (req, res) => {
  try {
    const grantId = req.params.grantId;

    const messages = getRecentMessages(grantId);

    const summary = await summarizeEmails(messages);

    res.send(`
<html>
<head>
<title>AI Inbox Summary</title>
<style>
body {
  font-family: Arial, sans-serif;
  background: #f4f6f9;
  padding: 40px;
}

.card {
  background: white;
  max-width: 900px;
  margin: auto;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #2563eb;
}

pre {
  white-space: pre-wrap;
  font-size: 16px;
  line-height: 1.6;
}
</style>
</head>

<body>
  <div class="card">
    <h1> AI Inbox Summary</h1>
    <pre>${summary}</pre>
  </div>
</body>
</html>
`);

  } catch (error) {
    console.error(error);
    res.status(500).send("Summary failed");
  }
});

app.get("/send-summary/:grantId", async (req, res) => {
  try {
    const grantId = req.params.grantId;
    const to = String(req.query.to || "");

    if (!to) {
      return res.status(400).send("Missing recipient");
    }

    const messages = getRecentMessages(grantId);
    const summary = await summarizeEmails(messages);

    await sendEmail(
      grantId,
      to,
      "AI Inbox Summary",
      `<pre>${summary}</pre>`
    );

    res.send("Summary email sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Send summary failed");
  }
});

app.get("/me", async (_req, res) => {
  const user = db
    .prepare("SELECT grant_id FROM users LIMIT 1")
    .get() as any;

  if (!user) {
    return res.status(400).send("No connected grant yet");
  }

  const account = await getAccount(user.grant_id);
  res.json(account);
});

startScheduler();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});


