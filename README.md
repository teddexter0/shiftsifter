# ShiftSifter ⚕

A shift rota viewer built for the Emergency Department at Moi Teaching and Referral Hospital (MTRH), Eldoret.

Built by [Ted Dexter](https://dex-dev.org) during a placement at MTRH.

---

## The problem

The ED admin managed nurse shift rotas in Excel — manually scanning rows to find who's on which shift, on which day. Every month, from scratch.

## The fix

Upload the monthly `.xlsx` rota and instantly see every shift broken down by day, shift type, week, or staff name. Works on phone or desktop.

The file never touches a server — parsed entirely in the browser.

---

## Auth

OTP via email. One authorised address. Code is single-use and expires in 10 minutes.

---

## Stack

Next.js · Resend · Upstash Redis · SheetJS