# Connecting TommyAndFurry to Carmitra

For the developers of the TommyAndFurry website and backend. It explains how the motor insurance
journey creates the customer and their vehicle's Carmitra ID and QR.

Carmitra is the vehicle product of the WeSafe QR family. PetSafeQR (pets) and WeSafe QR (people)
have the same kind of API, with the same rules, and one customer account works on all three.

## The idea

TommyAndFurry already verifies the customer's mobile with an OTP. Carmitra trusts that check. When
you underwrite a vehicle, your server sends the mobile and the vehicle's details. Carmitra creates
the user, with no second OTP, and the vehicle's Carmitra ID, which is its QR. We print the QR and
send it to the customer.

Anyone who scans the QR can reach the owner: by private chat, which never shows the owner's
number, and by call or WhatsApp only if the customer agreed to show their number. The customer
can sign in to Carmitra at any time with the same mobile and an OTP.

## Rules

- **Call this API only from your backend.** The API key can create users, so it must never reach
  a browser or a mobile app.
- **Send a mobile only after your OTP has verified it.** Carmitra treats it as proof of who the
  customer is.
- **Do not fail the insurance journey if Carmitra is down.** Save the application, then retry
  the call later. Sending the same `partnerRef` again is safe.

## Connection

| | |
|---|---|
| Base URL | `https://<carmitra-site-address>/v1` (supplied at go-live) |
| Header | `X-Api-Key: <your key>`. Carmitra's key starts `csk_`. PetSafeQR and WeSafe QR each give you their own |
| Bodies | JSON |
| Mobile | 10 digits, or `+91` and 10 digits |

Errors look like this, with the usual HTTP status:

```json
{ "error": { "code": "mobile_mismatch", "message": "That mobile doesn't own this vehicle." } }
```

Validation errors (`400 invalid_input`) also carry `fields`, such as `{ "vehicle.plate": "..." }`.

## Calls

### Create the user

`POST /partner/owners`

```json
{
  "mobile": "9876543210",
  "owner": { "name": "Asha Rao", "city": "Pune" },
  "consent": { "version": "your-wording-version", "at": "2026-11-23T10:00:00.000Z" }
}
```

`owner` is optional. Returns `201` when Carmitra's owner record is new and `200` when it existed:

```json
{ "mobile": "+919876543210", "isNewUser": true, "created": true }
```

- `isNewUser` is `false` when the mobile already has an account on any WeSafe QR product.
- A name or city the customer wrote themselves is never replaced. Yours only fills in blanks.
- This call is optional: adding a vehicle creates the user too.

### Add a vehicle

`POST /partner/vehicles`

```json
{
  "mobile": "9876543210",
  "partnerRef": "your-application-id",
  "vehicle": { "type": "car", "plate": "MH 12 AB 1234", "model": "Honda City", "colour": "White" },
  "owner": { "name": "Asha Rao", "city": "Pune" },
  "consent": { "version": "your-wording-version", "at": "2026-11-23T10:00:00.000Z", "showNumber": false }
}
```

| Field | Rules |
|---|---|
| `vehicle.type` | `car`, `bike` (a bike or scooter) or `other` |
| `vehicle.plate` | A standard plate (`MH 12 AB 1234`) or a BH-series plate (`22 BH 1234 AA`). Spaces and case don't matter |
| `vehicle.model` | Optional. Make and model, shortened to 40 characters |
| `vehicle.colour` | Optional. White, Silver, Grey, Black, Red, Blue, Brown, Green, Yellow or Orange, in any case. Another colour is accepted but not shown |
| `partnerRef` | Optional but strongly advised. Repeating it returns the same vehicle |
| `owner` | Optional |
| `consent` | Required. See [Consent](#consent) |

Returns `201` for a new vehicle and `200` for one Carmitra already had:

```json
{
  "cmtId": "CMT-7K2M-94",
  "scanUrl": "https://carmitra.wesafeqr.com/v/CMT-7K2M-94",
  "isNewUser": true,
  "created": true
}
```

Store `cmtId` on the policy. `scanUrl` is what the printed QR holds.

You never get two IDs for one vehicle:

- the same `partnerRef` returns the same vehicle;
- a plate already on the customer's account returns that vehicle, for example at renewal or if
  the customer added it themselves;
- a `partnerRef` already used for a different mobile is refused with `409 ref_conflict`.

The scan page shows the vehicle's type, model and colour, and only the state and last four
digits of the plate (`MH •• 1234`). It never shows the owner's name or mobile, unless
`showNumber` is `true`.

### Read vehicles

- `GET /partner/owners/:mobile/vehicles` returns `{ "vehicles": [ ... ] }`, or an empty list. It
  includes vehicles the customer added on Carmitra themselves.
- `GET /partner/vehicles/:cmtId?mobile=9876543210` returns one vehicle:

```json
{
  "cmtId": "CMT-7K2M-94",
  "scanUrl": "https://carmitra.wesafeqr.com/v/CMT-7K2M-94",
  "type": "car",
  "plate": "MH12AB1234",
  "plateMasked": "MH •• 1234",
  "model": "Honda City",
  "colour": "White",
  "contactMode": "chat",
  "createdAt": "2026-11-23T10:00:05.000Z"
}
```

`contactMode` is `chat` (private chat only) or `number` (the number is shown too).

## Consent

Send `consent.showNumber: true` only if the customer agreed on your site that anyone who scans the
QR can see and call their mobile. If it is `false` or left out, people who scan can reach the
owner only by private chat. The customer can change this on Carmitra later.

Draft wording, until legal review under the DPDP Act is complete:

> I agree to share my vehicle's details with Carmitra, which will create my vehicle's QR. People
> who scan it can message me without seeing my number.
>
> (Optional) Anyone who scans my vehicle's QR can see and call my mobile number.

## Errors to handle

| Status and code | Meaning | What to do |
|---|---|---|
| `400 invalid_input` | A field failed validation | Fix the request; `fields` says which |
| `401 invalid_api_key` | Key missing or wrong | Check the server setting |
| `403 mobile_mismatch` | That mobile doesn't own the vehicle | Don't retry. Ask the customer to re-verify |
| `404 not_found` | No such vehicle | Treat as "no Carmitra record" |
| `409 ref_conflict` | `partnerRef` was used for another customer | Use a unique reference per application |
| `5xx`, timeout | Carmitra had a problem | Retry later with the same `partnerRef` |

## Try it locally

From the Carmitra folder:

```
npm install
npm run dev        (in one terminal)
npm run seed       (in another; it prints a local API key)
```

Then, with that key:

```
curl -X POST http://127.0.0.1:8788/v1/partner/vehicles \
  -H "X-Api-Key: csk_tommyandfurry_dev-key-for-local-testing-only" -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","partnerRef":"TEST-1","vehicle":{"type":"car","plate":"MH12AB1234"},"consent":{"version":"test","at":"2026-11-23T10:00:00.000Z"}}'
```
