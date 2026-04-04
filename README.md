# ShiftSifter ⚕
**MTRH Emergency Department — Rota Viewer**

Built by [Ted Dexter](https://dex-dev.org) for the nursing staff at Moi Teaching and Referral Hospital, Eldoret.

---

## What it does

Transforms the monthly ED nurses duty rota (`.xlsx`) into a clean, filterable shift view — by day, shift type, week, or staff name. No more squinting at spreadsheets.

Upload the file. Everything runs in your browser. Nothing is sent to any server.

---

## Auth

OTP-based. Only the authorised email receives a code. Code expires in 10 minutes and is single-use, stored in Vercel KV.

---

## Stack

- **Next.js 14** (App Router)
- **Resend** — transactional email for OTP delivery
- **Vercel KV** — Redis-backed OTP store, no cold-start issues
- **SheetJS (xlsx)** — client-side Excel parsing

---

## Deploy

### 1. Create Vercel KV store
Vercel dashboard → Storage → Create → KV → copy the env vars it gives you

### 2. Set environment variables
```bash
vercel link
vercel env add RESEND_API_KEY production   # re_...
vercel env add ALLOWED_EMAIL production    # authorised email
# Also add KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN from Vercel KV dashboard
```

### 3. Deploy
```bash
npm install
vercel --prod
```

---

## Updating the authorised email

Vercel dashboard → Project → Settings → Environment Variables → edit `ALLOWED_EMAIL` → redeploy. No code changes needed.

---

*Built during a placement at MTRH Emergency Department, 2026.*
