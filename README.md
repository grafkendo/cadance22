# Cadence — Projects, in rhythm

A simple kanban-style project board for managing ideas and agile development.
Clean, pro, easy on the eyes. No backend — state persists in the browser via
localStorage.

## Brand

- **Name:** Cadence
- **Palette:** warm paper `#F7F6F3`, white surfaces, ink `#1A1D21`, muted `#6B7280`,
  deep teal accent `#0F766E` (soft `#E3F2EF`)
- **Priority dots:** high `#DC2626`, medium `#D97706`, low `#94A3B8`
- **Type:** Inter (UI), IBM Plex Mono (labels/meta)
- **Mark:** rounded teal square, three white rhythm bars (inline SVG + favicon)

## Features (v1)

- Sidebar project list with open-card counts, filter by project
- Columns: Backlog / To Do / In Progress (WIP limit 3, flagged when over) / Done
- Cards: title, description, priority, project; click to edit in modal
- Drag & drop between columns
- Search across cards
- Add/edit/delete projects and cards
- Header stats: open / in progress / done
- Seeded with real Protograph + Sketch Tool + Ideas tasks on first run
- Responsive: sidebar collapses, columns scroll horizontally on mobile

## Google Drive backup

Every change is auto-backed up to Google Drive (~2.5s after the change) as
`Cadence/cadence-backup.json`, using the narrow `drive.file` scope (the app
can only touch files it created).

One-time setup (about 3 minutes):

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   (create a project if needed) and **Create Credentials → OAuth client ID**
   → type **Web application**.
2. Under **Authorized JavaScript origins**, add:
   `https://cadence-protoograf22.vercel.app`
3. Copy the client ID and paste it into `deploy/app.js` as `GOOGLE_CLIENT_ID`.
4. Redeploy. In Cadence, click **Connect Google Drive** and approve.

## Deploy

Static site (`deploy/`). Vercel project `cadence`, production target.
Deployed via the Vercel MCP: `upload_file` × 3, then `create_deployment`
with `{name:"cadence", target:"production", files:[...]}`.
