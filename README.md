# easylists

A shared todo list app with no accounts — share a list by sending its link, and anyone who has it can see and tick off the same items in real time.

**[easylists.app](https://easylists.app)**

## Features

- **No accounts, just a link** — each "notepad" is identified by an unguessable URL; share it with whoever you want to collaborate with, and that link is the only credential it needs
- **Mobile-first, ruled-notepad design** — swipe right to complete an item, swipe left to delete a done one, long-press to add it as a calendar event
- **Synced across devices** — everyone with the link sees the same lists, kept in sync automatically
- **AI-populated via Claude** — add easylists as a custom MCP connector in Claude.ai and ask Claude to turn a screenshot or pasted note into todo items, filed into the right list (or a new one it creates) for you

## How it works

A notepad holds multiple lists (e.g. "Shopping", "Wedding"), each with its own todo items. Visiting the app creates a new notepad; sharing its URL is the entire "invite" — there's no sign-up, and having the link is what grants access.

## Stack

- **Frontend** — React + Vite
- **Backend** — ASP.NET Core Minimal API + PostgreSQL, also exposing a [Model Context Protocol](https://modelcontextprotocol.io) server so Claude can read and populate a notepad directly
- **Hosting** — Railway

## Development

```bash
npm install
npm run dev
```

The frontend talks to the API via `VITE_API_BASE_URL`. The backend lives in `server/` (ASP.NET Core) and needs a `DATABASE_URL` pointing at a Postgres instance; the schema applies itself automatically on startup.
