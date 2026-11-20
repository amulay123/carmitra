# Carmitra

A QR sticker for cars, bikes and scooters. Anyone who needs the owner scans it, picks what's
happening, and either calls (if the owner shows their number) or chats privately, with neither
side seeing the other's number. Part of the WeSafe QR family beside PetSafeQR, with
TommyAndFurry's colours and branding. Users are shared with WeSafe QR (same Firebase project).

- Design: [docs/superpowers/specs/2026-11-20-carmitra-design.md](docs/superpowers/specs/2026-11-20-carmitra-design.md)

| Folder | What it is |
|---|---|
| `web/` | The website: home page, owner app, scan and chat pages (React, Vite, Tailwind) |
| `api/` | The server: every write, the chat and its limits, WhatsApp alerts (Express, firebase-admin) |
| `shared/` | Validation rules, ID and plate formats, and types used by both |
| `firebase/` | Database rules, with their tests |
| `scripts/` | Sticker batches, local sample data, the Netlify build |

## Run it locally

Needs Node 22+, Java 21+ and the Firebase CLI (`npm i -g firebase-tools`). Everything runs on the
Firebase emulators under a demo project, so nothing touches WeSafe's live data. The ports differ
from PetSafeQR's, so both can run at once.

```
npm install
npm run dev
```

The site is at http://127.0.0.1:5174. In a second terminal, `npm run seed` adds two sample
pre-printed stickers.

Mobile sign-in on the emulator sends no SMS. Read the code from
http://127.0.0.1:9098/emulator/v1/projects/demo-carmitra/verificationCodes

To try the chat, open a vehicle's scan page in a private window, so you are a stranger there.
Emulator data is lost when `npm run dev` stops.

## Checks

```
npm run typecheck
npm run lint
npm test           unit tests, then API and rules tests on the emulators (stop npm run dev first)
npm run build
```

## Going live

The website and the API are published together on Netlify, on one address. The API runs as a
Netlify Function at `/v1`. `netlify.toml` holds the build settings.

There is no `firebase.json` here on purpose, so `firebase deploy` can't run from this folder and
overwrite WeSafe's rules.

### 1. Firebase (do this first: the site can't read its data without it)

1. **Firestore rules.** Copy the part of `firebase/firestore.rules` between `BEGIN CARMITRA` and
   `END CARMITRA` into `wesafe-rewamp/firestore.rules`, inside
   `match /databases/{database}/documents`, beside PetSafeQR's block. Deploy from
   `wesafe-rewamp` with `firebase deploy --only firestore:rules`. Carmitra needs no storage
   rules: it uploads nothing.
2. **Automatic deletion.** Chats are deleted 30 days after they start. In the Google Cloud
   console for `wesafe-40d85`, open Firestore, Time-to-live, and create a policy on the field
   `expireAt` for each of these collection groups: `carChats`, `carChatRooms`, `carMessages`,
   `carChatKeys`, `carThrottle`, `carBlocks`. Until then nothing is deleted; everything else
   still works.
3. **Service-account key.** In the Firebase console, open Project settings, Service accounts, and
   generate a key for `wesafe-40d85` (PetSafeQR's key works too). It gives full access to
   WeSafe's data, so keep the file out of this folder and never send it to anyone.

### 2. Netlify

1. In Netlify, add a new project from this folder: either import it from a GitHub repository,
   or use the command line below. Keep the build settings it shows: they come from
   `netlify.toml`. Leave Base directory and Package directory empty.
2. Copy `.env.netlify.example` to `.env.netlify` and fill it in. Under Project configuration,
   Environment variables, choose to import from a `.env` file and paste it in.
3. Add one more variable, `FIREBASE_SERVICE_ACCOUNT`. Its value is the whole contents of the
   service-account JSON file. Mark it as containing a secret if Netlify offers that.
4. Deploy.

From the command line, without GitHub:

```
npx netlify-cli login
npx netlify-cli sites:create
npx netlify-cli env:import .env.netlify
npm run netlify:key -- path/to/service-account.json
npx netlify-cli deploy --build --prod
```

### 3. Check it

Add the Netlify address under Firebase Authentication, Settings, Authorized domains, or Google and
mobile sign-in will fail. Then:

- `https://<site>/v1/health` answers `{"ok":true}`.
- Sign in, add a vehicle, and open its QR on another phone.
- Pick a reason and notify the owner: a chat opens, and a WhatsApp message arrives if
  `WHATSAPP_TOKEN` is set. Reply from the owner's side and watch it arrive on the other phone.

### 4. Domain

Add the domain in Netlify (Domain management), make it the primary domain, add it to Firebase's
Authorized domains, then deploy again. The site and the API take their address from the primary
domain, and that address is inside every QR, so settle it before printing any stickers. The design
assumes `carmitra.wesafeqr.com`.

### 5. Printed stickers

This runs on your computer against the live project. Copy `api/.env.example` to `api/.env` and
point `GOOGLE_APPLICATION_CREDENTIALS` at the key. Set `PUBLIC_URL` to the final domain first.

```
npm run tags:create -- 500 batch-name
```

It writes `tag-batches/batch-name.csv`, a code and a link per sticker, for the printer.

### Netlify's limits

- The API runs in Netlify's default region, US East (Ohio). Paid plans can move it closer to the
  Firebase project under Functions, Region.
- The first request after a quiet spell starts the function, which adds about a second.
