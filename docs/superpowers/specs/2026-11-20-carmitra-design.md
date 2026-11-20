# Carmitra: design

Date: 20 November 2026. Status: approved and built. The sections below describe what exists.

Sources: PetSafeQR (`../PetsafeQR`, its design in
`docs/superpowers/specs/2026-11-18-petsafeqr-design.md`), the WeSafe QR app (`../wesafe-rewamp`),
WeSafe's older car QR and chat (`../lostandfound-rewamp`), and TommyAndFurry's logo and brand
colours.

## 1. What it is

Carmitra is a QR sticker for vehicles, and the third product in the WeSafe QR family after WeSafe
QR (people) and PetSafeQR (pets). An owner signs in, adds a car, bike or scooter, and gets a
Carmitra ID and a QR straight away. Anyone who needs the owner (the car is blocking theirs, the
lights are on, it has been hit) scans the sticker, picks what's happening, and reaches the owner.

For each vehicle the owner chooses how:

- **Chat only** (the default). The number never appears. The person scanning opens a private
  chat; the owner gets a WhatsApp alert and replies from a link. Neither sees the other's number.
- **Show my number.** Call and WhatsApp buttons appear on the scan page, and the private chat
  stays too. This needs the owner's tick, given with the choice.

### Decisions

| Decision | Choice |
|---|---|
| Stack | The same as PetSafeQR: npm workspaces `web`, `api`, `shared`; one Netlify site with the API as a function at `/v1` |
| Users | Shared with WeSafe and PetSafeQR (Firebase project `wesafe-40d85`) |
| Look | PetSafeQR's page structure and motion; its own road look; TommyAndFurry's colours and logo |
| Old ZiddiQR stickers | Left as they are on the lost-and-found site |
| Chat access for the person scanning | No sign-in, with limits |
| Vehicles | Car, bike or scooter, other |
| Stickers | QR issued instantly; pre-printed stickers can be linked; a request form takes an address; no payment |
| A scan with no message | Recorded in the inbox, no WhatsApp alert |
| Domain | `carmitra.wesafeqr.com`, to be confirmed. It is one setting |

### Not in this version

Calls that hide both numbers (needs a paid calling service), checking who owns the vehicle (RC
check), payments, emergency contacts, insurance and PUC reminders, a partner API, moving ZiddiQR
stickers, and changes to PetSafeQR or WeSafe code.

## 2. How the three products work together

- **One account.** The same Firebase project, so a person is the same user everywhere. A WeSafe
  or PetSafeQR sign-in works on Carmitra.
- **Separate data, one rules file.** Carmitra writes only collections whose names start with
  `car`. It never writes WeSafe's `Users/` tree or PetSafeQR's `pet*` collections. Its rules sit
  between `BEGIN CARMITRA` and `END CARMITRA`, pasted into WeSafe's rules file beside PetSafeQR's.
- **Read across, never write across.** The server fills in a new owner's name, mobile and city
  from their WeSafe profile, or failing that their PetSafeQR owner record. Settings shows "Your
  WeSafe family" (a WeSafe profile, the number of pets on PetSafeQR), read with the user's own
  access, which the other products' rules already give them.
- **Shared conventions.** Mobiles stored as `+91XXXXXXXXXX`; ISO dates; the same 32-character ID
  alphabet with a product prefix (PSQ and PT for PetSafeQR, CMT and CT for Carmitra); the same
  API error shape; one WhatsApp gateway token, held only on the server.
- **Later, outside this build:** Carmitra in PetSafeQR's and WeSafe's menus; admin screens; a
  shared package for the design pieces once both sites have settled.

## 3. Data

All in WeSafe's Firestore. Reads go straight from the browser; every write goes through the API.

| Collection | Who can read it | Holds |
|---|---|---|
| `carOwners/{uid}` | The owner | Name, mobile, city, `mobileVerified`, consent |
| `carOwners/{uid}/vehicles/{cmtId}` | The owner | The list of their vehicles, with each plate |
| `carVehicles/{cmtId}` | Anyone, one at a time | Type, model, colour, `plateMasked` (`MH •• 1234`), note, `contactMode`, `contact` (only in number mode). No owner id, no full plate |
| `carVehicles/{cmtId}/private/details` | The owner | `ownerUid`, full plate, linked sticker codes, `numberConsentAt` |
| `carTags/{code}` | Anyone, one at a time | Whether linked, which vehicle, batch |
| `carScans/{id}` | The owner | Vehicle, how it was scanned, read or not |
| `carStickerOrders/{id}` | The owner | Recipient and address, `status: requested` |
| `carChats/{chatId}` | The owner | The room key, vehicle, reason, status, unread count, last message, `closesAt` |
| `carChatRooms/{roomKey}` | Anyone holding the key | Vehicle name, masked plate, reason, status, `ownerSeenAt`, `closesAt`. No owner id, no numbers |
| `carChatRooms/{roomKey}/carMessages/{id}` | Anyone holding the key | `from` (visitor or owner), text, time |
| `carChatKeys/{roomKey}` | Server only | The chat it belongs to, a hash identifying the visitor, their message count, when the owner was last alerted |
| `carThrottle`, `carBlocks` | Server only | Scan and chat limits; blocks |

Chat records carry `expireAt`, a timestamp 30 days on; a Firestore TTL policy deletes them.

### IDs and plates

- Carmitra ID `CMT-XXXX-XX`; pre-printed sticker code `CT-XXXX-XXXX`. The QR encodes
  `https://carmitra.wesafeqr.com/v/CMT-7K2M-94`; a sticker encodes `/t/CT-7K2M-94XQ`.
- Plates are stored without spaces: the standard format (`MH12AB1234`) and the BH series
  (`22BH1234AA`). A scan page shows only the state and the last four digits.

## 4. The API

Base path `/v1`. JSON in and out. Errors are `{ error: { code, message } }`.

**Owner** (Firebase ID token): `GET` and `PUT /me`; `POST /vehicles`; `PATCH` and
`DELETE /vehicles/:cmtId`; `POST /tags/:code/claim`; `POST /sticker-orders`;
`POST /scans/mark-read`; `POST /chats/:chatId/messages`, `/read`, `/close`, `/block`.

**Public:** `GET /health`; `POST /scans`; `POST /rooms` (a reason, and optional text; returns the
room key); `POST /rooms/:roomKey/messages`.

Removing a vehicle deletes its public and private records, frees its pre-printed stickers for the
next owner, and closes its open chats. Scans already recorded stay in the owner's inbox.

## 5. The private chat

- A room key is 32 random bytes. It is the visitor's whole access: the link `/c/{roomKey}`.
  The browser remembers it, so scanning again offers the same chat.
- The owner opens chats signed in, from the inbox or from the link in the WhatsApp alert.
- Both sides see new messages live from Firestore. Every message goes through the API.
- **Limits:** 500 characters a message; 20 messages from a visitor per chat; 3 new chats per
  vehicle per hour from one connection; a chat takes messages for 24 hours; it is deleted after
  30 days. The owner can close a chat, or block, which closes it and refuses new chats from that
  connection for that vehicle for 30 days.
- **WhatsApp:** when a chat starts; after that, at most once every 10 minutes while the owner has
  unread messages. Never for a scan with no message.
- The owner has quick replies. The visitor sees "Seen" once the owner opens the chat. Both see
  that Carmitra never asks for OTPs, passwords or payments.

## 6. The website

| Area | Path | Page |
|---|---|---|
| Public | `/` | Home |
| Public | `/auth` | Sign in: mobile OTP or Google |
| Public | `/v/:cmtId` | Scan page |
| Public | `/t/:code` | Pre-printed sticker |
| Public | `/c/:roomKey` | The visitor's chat |
| App | `/app` | My vehicles, and the latest messages |
| App | `/app/vehicles/new` | Add a vehicle: vehicle, how people reach you, your details (once), then the QR |
| App | `/app/vehicles/:cmtId` | The sticker, Save QR and Print; how people reach you; messages; stickers; scans; remove |
| App | `/app/vehicles/:cmtId/edit` | Edit the details |
| App | `/app/inbox` | Messages and scans |
| App | `/app/chats/:chatId` | The owner's chat |
| App | `/app/link-sticker` | Link a pre-printed sticker, typed or scanned with the camera |
| App | `/app/get-sticker` | Request a printed sticker |
| App | `/app/settings` | Owner details, the WeSafe family, sign out |

App navigation: Vehicles, Inbox, Link sticker, Get sticker, Settings. A bar along the bottom on a
phone, along the top on a computer.

The **scan page** shows the vehicle drawn in its colour with the masked plate, "Need the owner?",
six reasons (Blocking my vehicle, Lights are on, Window or door open, Parking or towing, Accident
or damage, Something else), Call and WhatsApp when the number is shown, the private chat button,
the owner's note, "Emergency? Call 112" and the Carmitra ID. The owner looking at their own
vehicle sees "This is what a scanner sees" and nothing is recorded.

Printing a vehicle's page prints only its sticker, 9 cm square, with no personal details.

## 7. Look and motion

- **Structure and motion from PetSafeQR:** the same home page blocks in the same order (hero, what
  your vehicle gets, what a scanner sees, how it works, private chat, what one sticker is for,
  questions, closing, footer), and the same Motion kit, reduced-motion rules and `?motion=on`.
- **Colours from TommyAndFurry:** the logo's green (brand, navy text on it), salmon and red, with
  TommyAndFurry's navy and cream, and a soft blue. Defined once in `web/src/styles/index.css`.
- **Type:** Archivo, tall condensed capitals for headlines; Geist for everything else.
- **Shapes:** navy outlines and hard offset shadows, like number plates; road signs for stickers;
  lane dashes, a zebra crossing and a red and white kerb between blocks; a road the cars drive on.
- **Vehicles are drawn**, in SVG, not photographed: free car photos carry makers' badges and
  number plates. Their wheels turn as the page scrolls.
- **TommyAndFurry's logo** appears in the footer, the "what one sticker is for" block, sign-in and
  settings, as "In partnership with" or "Brought to you with".
- Copy rules: no invented numbers or quotes; no claim that the number is private except in
  chat-only mode; later features marked "coming later".

## 8. Checks

- `shared`: IDs, plate formats and masking, the vehicle, owner and chat rules.
- `api`, on the emulators: owner details and prefill; vehicles, the consent rule, duplicates,
  edits and removal; stickers; scans and their limit; chats from start to block, including the
  limits, the 24-hour close, and that nothing a visitor can read carries the owner's id, number or
  full plate; the API inside the Netlify function.
- Rules: every allow and deny in the table above, including that rooms can't be listed and
  messages can't be searched across rooms.

## 9. Known limits

- **Limits and blocks go by connection.** People behind the same mobile network address count as
  one; someone can dodge a block by changing network.
- **Anyone with a chat's link can write in it as the visitor.** The link is long and random, and
  the visitor holds it.
- **Nobody checks that a vehicle is the owner's.** Two accounts can register the same plate.
- **Sign-in doesn't carry between sites.** Signing in on PetSafeQR doesn't sign you in to
  Carmitra on the same phone, though it is the same account.
- **A mobile typed by someone signed in with Google is not verified**, as on WeSafe and PetSafeQR.
  Alerts go to it, and number mode shows it.
- **Owners reply in the browser.** The WhatsApp gateway only sends.
- **The consent wording is a draft** until the wording required by the DPDP Act is agreed.
- **Indian mobile numbers and plates only.**
