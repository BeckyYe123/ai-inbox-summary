# AI Inbox Summary

An AI-powered email assistant built with TypeScript, Express, SQLite, and Nylas.

## Features

### Gmail OAuth Integration
- Connect Gmail accounts through Nylas OAuth.
- Secure authentication flow.
- Supports multiple connected mailboxes.

### Inbox Synchronization
- Sync recent inbox messages.
- Store emails locally in SQLite.
- Prevent duplicate message imports.

### AI Email Summaries
- Generate concise inbox summaries.
- Highlight important messages.
- Reduce email overload.

### Priority Inbox
Emails are automatically categorized into:

- 🔴 Action Required
- 🟡 Important
- 🟢 Promotional

Promotional emails are filtered using sender and subject analysis.

### Dashboard Analytics
Track:

- Total Emails
- Unread Emails
- Promotional Emails
- Filter Rate

### Email Delivery
- Send generated summaries directly by email.
- Powered by Nylas Send API.

### Scheduled Summaries
- Automatic recurring inbox summaries.
- Scheduler checks cadence settings.
- Prevents duplicate summary windows.

---

## Tech Stack

### Backend
- TypeScript
- Node.js
- Express

### Database
- SQLite

### Email Infrastructure
- Nylas API

### AI Layer
- OpenAI API
- Deterministic fallback summarizer

---

## Project Structure

```text
src/
├── services/
│   ├── nylas.ts
│   ├── openai.ts
│   └── scheduler.ts
│
├── repositories/
│   ├── messageRepository.ts
│   └── userRepository.ts
│
├── config.ts
├── db.ts
└── index.ts
```

---

## Architecture

Gmail / Mail Provider
↓
Nylas OAuth + Webhooks
↓
Express TypeScript Backend
↓
SQLite Storage
↓
AI Summarizer
↓
Scheduler
↓
Nylas Email Send API

## Webhook Design

The app exposes `/webhooks/nylas` for Nylas webhook events.

It supports:
- Nylas challenge verification
- `x-nylas-signature` HMAC validation
- fast 200 OK acknowledgment
- asynchronous processing with `setImmediate`
- duplicate prevention using `message_id`
- truncated payload handling by refetching the full message from Nylas

## Scheduling Strategy

The app uses a database-backed polling scheduler.

Each connected user stores:
- `grant_id`
- `destination_email`
- `cadence`
- `last_summary_at`

Supported cadences:
- hourly
- every 6 hours
- daily

The scheduler checks users every minute and only sends a summary when the stored cadence window has elapsed. The `summary_runs` table prevents duplicate summary windows across restarts.

## Setup

Install dependencies:

```bash
npm install
```

Create environment variables:

```bash
cp .env.example .env
```

Fill in:

```env
OPENAI_API_KEY=
NYLAS_API_KEY=
NYLAS_CLIENT_ID=
NYLAS_CLIENT_SECRET=
NYLAS_CALLBACK_URI=
```

Start the application:

```bash
npm run dev
```

---

## Main Routes

### Connect Mailbox

```text
/connect
```

### Sync Inbox

```text
/sync/:grantId
```

### Generate Summary

```text
/summary/:grantId
```

### Priority Inbox

```text
/priority/:grantId
```

### Send Summary

```text
/send-summary/:grantId
```

---

## Future Improvements

- Real OpenAI-powered prioritization
- Archive/Delete email actions
- Full email body retrieval
- Multi-user support
- Webhook-based email updates
- React frontend
- Vector search for email retrieval

---

## Author

Dongyan Ye

Rutgers University

Electrical Engineering Major  
Computer Science Minor
