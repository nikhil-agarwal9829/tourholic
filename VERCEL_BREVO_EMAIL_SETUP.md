# Touroholic — Brevo Transactional Email & Audited Payment Reconciliation Guide

This document outlines the deployment, configuration, verification, and troubleshooting processes for Brevo transactional email delivery and audited payment reconciliation in the Touroholic Next.js application.

---

## 1. Required Environment Variables

Configure these variables in your local `.env.local` file and in the **Vercel Project Dashboard** under `Settings` → `Environment Variables`:

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `BREVO_API_KEY` | **Yes** | `xkeysib-xxxxxxxxxxxxxxxxxxxx` | Brevo v3 Transactional API Key (`api-key` header) |
| `BREVO_SENDER_EMAIL` | **Yes** | `concierge@touroholic.com` | Verified Brevo sender or domain email address |
| `BREVO_SENDER_NAME` | **Yes** | `Touroholic Expeditions` | Display sender name in email clients |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://tourholic.vercel.app` (or `http://localhost:3000` locally) | Canonical base URL used in verification links and booking CTA buttons |
| `MONGODB_URI` | **Yes** | `mongodb+srv://...` | MongoDB Atlas cluster connection string |
| `AUTH_SECRET` | **Yes** | `32+ character random secret` | JWT session signature secret |
| `PAYMENT_DUE_DAYS` | No | `3` | Days allowed before unpaid reservations become overdue |
| `CRON_SECRET` | No | `random secret string` | Bearer token securing automated reminder endpoints |

> [!IMPORTANT]
> **No Secrets in Source Code:** Never commit `.env.local` or paste your raw API keys into Git. Touroholic's `.gitignore` explicitly ignores `.env*` and `smtp_server.txt`.

---

## 2. Brevo (Sendinblue) Sender & Domain Setup

### Step A: Generate a Transactional API Key
1. Log in to [Brevo](https://app.brevo.com/).
2. In the top-right profile menu, click **SMTP & API**.
3. Select the **API Keys** tab.
4. Click **Generate a new API key**, name it `Touroholic Vercel Production`, and copy the key (starts with `xkeysib-`).
5. Save this value as `BREVO_API_KEY`.

### Step B: Register and Verify Sender Email
1. In Brevo, go to **Senders, Domains & Dedicated IPs** → **Senders**.
2. Click **Add a Sender**.
3. Enter `Touroholic Expeditions` for the name and your sender email (e.g. `concierge@touroholic.com` or your verified work email).
4. Brevo will send a verification link to that inbox. Click the verification link to activate the sender.

### Step C: Authenticate Your Sending Domain (Recommended for Production)
1. In Brevo, go to **Senders, Domains & Dedicated IPs** → **Domains**.
2. Click **Add a Domain** (e.g., `touroholic.com`).
3. Add the TXT records provided by Brevo to your DNS registrar (GoDaddy, Cloudflare, Namecheap, etc.):
   - **Brevo Code (Domain ownership)**: TXT record
   - **DKIM (Email signing)**: TXT record
   - **DMARC (Policy enforcement)**: TXT record `v=DMARC1; p=none; sp=none;`
4. Click **Verify & Authenticate**. This prevents your emails from landing in spam folders.

---

## 3. Configuring Environment Variables in Vercel

1. Open your project on [Vercel](https://vercel.com/dashboard).
2. Go to **Settings** → **Environment Variables**.
3. Add each variable for **Production**, **Preview**, and **Development**:
   - `BREVO_API_KEY` = `xkeysib-...`
   - `BREVO_SENDER_EMAIL` = `your-verified-sender@domain.com`
   - `BREVO_SENDER_NAME` = `Touroholic Expeditions`
   - `NEXT_PUBLIC_APP_URL` = `https://tourholic.vercel.app`
4. Trigger a new deployment via **Deployments** → **Redeploy** to pick up the changes.

---

## 4. Email Verification Architecture

### Registration Flow
1. User submits registration at `/api/auth/register`.
2. Server validates input, normalizes email (`toLowerCase().trim()`), and checks uniqueness.
3. User is created in MongoDB with `emailVerified: false`.
4. A high-entropy single-use token is generated via `crypto.randomBytes(32).toString('hex')`.
5. Only the SHA-256 hash (`verificationTokenHash`) and 24-hour expiry (`verificationTokenExpiresAt`) are persisted in MongoDB. The plaintext token is never stored in the database.
6. A responsive Touroholic-branded verification email is dispatched via Brevo REST API (`https://api.brevo.com/v3/smtp/email`).
7. User receives an immediate banner notification and can browse tours freely.

### Verification Flow
1. User clicks the link in their email: `${NEXT_PUBLIC_APP_URL}/verify-email?token=<token>`.
2. The page calls `GET /api/auth/verify-email?token=<token>`.
3. The server computes the SHA-256 hash of the incoming token and looks up the unexpired user.
4. On match:
   - Sets `emailVerified = true`.
   - Clears `verificationTokenHash` and `verificationTokenExpiresAt` to prevent token reuse.
   - Refreshes the `touroholic_session` HTTP-only cookie.
5. Displays a confirmation screen unlocking expedition reservations.

### Resend & Cooldown
- Endpoint: `POST /api/auth/resend-verification`.
- Enforces a **120-second cooldown** based on `lastVerificationEmailSentAt` to prevent spam.
- Protects user privacy: returns a generic success message if the email does not exist (prevents enumeration).

### Admin Account Safeguards
- Administrators (`role === 'admin'`) are automatically exempt from verification lockouts.
- When running `npm run seed`, the default administrator (`admin@touroholic.com`) is seeded with `emailVerified: true`.

---

## 5. Audited Payment Reconciliation

Located in `/admin/bookings`:
1. Click **Reconcile Payment** on any pending or unpaid reservation.
2. The modal displays:
   - Expedition booking reference
   - Total amount and currency
   - Traveler name
3. Input required fields:
   - **Payment Reference / Transaction ID** (min 3 characters, e.g. `WIRE-839201`)
   - **Payment Channel / Method** (Bank Transfer, Credit Card Terminal, Cash, UPI)
   - **Audit Notes** (min 5 characters documenting the verified receipt)
4. Click **Record Verified Payment**:
   - The server verifies administrator authorization.
   - Rejects duplicate transaction reference numbers across both `Payment` records and `Booking` records.
   - Creates a persistent `Payment` document in MongoDB with full audit metadata (`reconciledBy`, `reconciledAt`, `paymentReference`, `notes`).
   - Updates `Booking`: `paymentStatus: "paid"`, `outstandingBalance: 0`, and records verification timestamps.
   - Appends an entry to `AuditLog`.
   - Sends a customer payment confirmation email via Brevo.
   - **Isolated Error Boundary:** If email notification fails, the legitimate payment record is NOT rolled back.
   - Upon confirmation from the server, the modal automatically closes and booking/revenue tables refresh.
   - If validation or database saving fails, the modal **remains open**, preserves all entered values, and displays the specific server error.

---

## 6. Transactional Notifications Overview

All transactional templates feature responsive HTML with Touroholic dark-forest branding (`#124e3f`), structured detail tables, and plain-text fallbacks:

| Notification Type | Trigger | Content |
|---|---|---|
| **Email Verification** | User registration / Resend | Activation link (24h validity), explorer greeting |
| **Booking Confirmation** | Booking created | Reference, tour name, dates, traveler count, price, deadline |
| **Payment Confirmation** | Payment reconciled | Amount received, reference number, method, timestamp |
| **Payment Reminder** | Admin reminder / Scheduled cron | Outstanding amount, payment deadline, secure booking link |
| **Booking Cancellation** | Admin / Traveler cancellation | Reason, refund notes, seat inventory status |

---

## 7. Troubleshooting Guide

### 1. `Brevo email service is missing BREVO_API_KEY or BREVO_SENDER_EMAIL`
- Ensure the environment variables are configured in `.env.local` (local) or Vercel Environment Variables (production).
- Note: Environment variable changes in Vercel require a deployment redeploy to take effect.

### 2. `Key not registered or unauthenticated (401 Unauthorized)`
- You may have copied an SMTP password instead of a v3 API key. Verify that the key begins with `xkeysib-` and was created in Brevo under **SMTP & API** → **API Keys**.

### 3. `Sender not verified (400 Bad Request)`
- The email in `BREVO_SENDER_EMAIL` has not completed verification in Brevo.
- Go to Brevo → **Senders** and verify the confirmation email sent to that address.

### 4. Emails Landing in Spam / Junk
- Complete domain authentication (SPF, DKIM, DMARC) in Brevo.
- Ensure `BREVO_SENDER_NAME` is set to a clear, recognizable name.

### 5. Duplicate Transaction Reference Error
- Touroholic enforces financial integrity: duplicate transaction references are blocked.
- Ensure the transaction ID or bank wire sequence number is unique.
