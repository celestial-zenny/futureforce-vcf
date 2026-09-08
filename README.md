# Futureforce VCF Drop

Timed VCF contact collection. Create a link, share it on WhatsApp, let people
drop their numbers, then download the compiled `.vcf` from a private admin panel.
No accounts, no logins, no sign-up.

Built for the case where a group needs everyone's number saved in everyone's
phone — you open a collection window, blast the link, and hand out one contact
file when the timer runs out.

## How it works

1. **Create a pool.** Pick a name, a contact-save prefix, and how long the link
   should stay open. You get back two URLs: a public one to share and a private
   admin one.
2. **Share the public link.** Anyone who opens it submits their name and phone
   number. Numbers are normalized against the pool's country dial code, so
   `08012345678` becomes `+2348012345678`.
3. **Collect from the admin panel.** Watch submissions arrive live, delete junk
   entries, extend the timer, and export when you're ready.

Three URL shapes drive the whole app:

| URL | View |
| --- | --- |
| `/` | Home — create a pool, browse your saved pools, use the offline tools |
| `/?pool=vcf_xxxxxxxx` | Participant form |
| `/?admin=adm_xxxxxxxxxxxxxxxxxxxxxxxx` | Private admin panel |

The admin key is the only credential. There is no password to recover it, so
whoever holds the key holds the pool. Keys are stored in your browser's
`localStorage` under `futureforce_saved_pools` (most recent 15) and listed under
**My Active Links**, which is how you get back into a pool after closing the tab.

## Features

**Timed collection pools** — presets from 1 hour to 48 hours, or a custom window
up to 168 hours. Minimum is 5 minutes. When the timer expires the pool closes to
new submissions and compiles.

**Phone normalization** — ten country dial codes selectable per pool (Nigeria,
US/Canada, UK, Ghana, Kenya, South Africa, India, UAE, Germany, France), with
Nigeria as the default. Local leading-zero formats are rewritten to full
international form.

**Duplicate rejection** — optional per pool. When on, a number already in the
pool is refused with a message rather than silently dropped.

**Three export formats** — `.vcf` (vCard 3.0), `.csv` with submission
timestamps, and `.txt` listing each number with its submitter name in
parentheses. Contacts are named `<prefix> 001 - <name>`, so they group together
alphabetically in a phone's contact list.

**Optional participant download** — if enabled, participants can grab the
compiled file themselves once the timer ends. Off means only the admin key can
export.

**Instant raw compiler** — paste a blob of pasted text or CSV and get a `.vcf`
back immediately, no pool involved. Handles comma, colon, tab, pipe, and
` - ` delimiters, detects which side of the line is the number, and offers four
naming templates (`Prefix 001`, `Prefix - Name`, `Name (Prefix)`, `Name`).

**Single vCard + QR** — build one business card with organization, title, email,
website, and note fields, then export it as a `.vcf` or a scannable QR code.

**Standalone single-file build** — `public/index-standalone.html` is a
zero-dependency, no-Node copy of the raw compiler, exporting `.vcf` and `.csv`.
Drop it on cPanel, GitHub Pages, Cloudflare Pages, or a USB stick and it works
offline. It does not include pool collection (that needs a server), the single
vCard/QR builder, or TXT export — despite the in-app modal claiming full feature
parity.

## Running it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build        # vite build + esbuild bundle -> dist/
npm start            # node dist/server.cjs
```

Other scripts: `npm run lint` (typecheck only, `tsc --noEmit`), `npm run preview`.

### Configuration

Copy `.env.example` to `.env`. Both variables are optional:

- `PORT` — port to listen on, defaults to `3000`
- `APP_URL` — public base URL, used when building shareable links

The WhatsApp community invite shown on the home page is hardcoded as
`WHATSAPP_INVITE_URL` at the top of `src/App.tsx`. Change it there.

## API

Pool creation and participant submission are unauthenticated by design. Admin
routes are gated on the 24-hex-character admin key.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/pools` | Create a pool, returns `poolId` and `adminKey` |
| `GET` | `/api/pools/:id` | Public pool info and submission count |
| `POST` | `/api/pools/:id/contacts` | Submit a contact |
| `GET` | `/api/pools/admin/:adminKey` | Full pool with all contacts |
| `PATCH` | `/api/pools/admin/:adminKey` | Update settings, end early, or `extendMinutes` |
| `DELETE` | `/api/pools/admin/:adminKey/contacts/:contactId` | Remove a contact |
| `GET` | `/api/pools/admin/:adminKey/export/:format` | Export `vcf`, `csv`, or `txt` |
| `GET` | `/api/pools/:id/export/:format` | Participant export, expired pools only |

## Layout

```
server.ts                 Express app, API routes, Vite middleware
server/storage.ts         Persistence, phone normalization, export builders
src/App.tsx               Query-param routing between the three views
src/components/           CreatePoolCard, ParticipantSubmitView, AdminPanelView,
                          BulkGenerator, SingleCardGenerator, MyCampaignsList,
                          WhatsAppCommunityCard, StandaloneModal
src/utils/vcf.ts          Client-side vCard/CSV/TXT generation and raw parsing
src/utils/api.ts          Typed fetch wrappers
public/index-standalone.html  Offline single-file edition
data/pools.json           Runtime database (gitignored)
```

React 19, Vite 6, Tailwind 4, Express 4, TypeScript.

## Storage

Everything lives in `data/pools.json`, written on every mutation. The file is
gitignored — it holds real names and phone numbers and must not be committed.

Back it up by copying that one file. Reset everything by writing `{}` into it.

## Known limitations

Read these before putting the app in front of a real crowd.

**Writes are not concurrency-safe.** Every request loads the whole JSON file,
mutates it, and writes it back with no locking. Two people submitting in the same
instant can cost you one of the two contacts. This is the constraint that matters
most, because blasting a link to a large group is exactly the workload that
triggers it. Moving `server/storage.ts` to SQLite in WAL mode fixes it without
changing anything else.

**Local disk is required.** Because state is a file, any host with an ephemeral
filesystem loses your data on redeploy or cold start, and any host running more
than one instance splits it. Deploy to a single instance with a persistent
volume.

**No rate limiting.** Anyone with a pool link can script unlimited submissions,
and anyone with the app URL can create unlimited pools. Name, title, and
description fields have no length cap.

**The admin key travels in the query string.** That places your only credential
into server access logs, proxy logs, and outbound `Referer` headers.

**CSV exports are not formula-safe.** A submitter who names themselves
`=HYPERLINK(...)` gets that formula executed when the export is opened in Excel.

**`00` international prefixes are mishandled.** `002348012345678` normalizes to
`+234002348012345678` instead of `+2348012345678`.
