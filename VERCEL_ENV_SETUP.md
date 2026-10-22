# Vercel Environment Variables Configuration Guide

This guide walks you through configuring production environment variables on Vercel for **Touroholic**.

> **Important**: Vercel environment variables must be entered **individually as key-value pairs** in the Vercel dashboard. The file [`.env.vercel.example`](./.env.vercel.example) serves as a reference template and should never contain your actual secrets or be uploaded directly.

---

## 1. Opening Your Project in Vercel

1. Log in to [vercel.com](https://vercel.com).
2. If this is a new deployment:
   - Click **Add New...** → **Project**.
   - Select your GitHub account and find `nikhil-agarwal9829/tourholic`.
   - Click **Import**.
3. If you already created the project:
   - Click on your `tourholic` project from the Vercel Dashboard.

---

## 2. Navigating to Settings → Environment Variables

1. In your project dashboard, click on the **Settings** tab in the top navigation.
2. In the left-hand sidebar, click on **Environment Variables**.
3. You will see an entry form where you can add Key-Value pairs.

---

## 3. Production Variables to Add

Add the following 6 environment variables. For each variable:
- Enter the **Key**.
- Enter the corresponding **Value** (from your local private `.env.local` or `api.txt`).
- Select the **Production** environment checkbox (and optionally **Preview**).
- Click **Save**.

| Variable Name | Environment | Description & Value Source |
| :--- | :--- | :--- |
| `MONGODB_URI` | **Production**, Preview | Your MongoDB Atlas connection string (points to the `Touraholics` database). Sourced from `.env.local`. |
| `CLOUDINARY_CLOUD_NAME` | **Production**, Preview | Your Cloudinary cloud name (`oxkiah1r`). |
| `CLOUDINARY_API_KEY` | **Production**, Preview | Your Cloudinary API key (`524323375511768`). |
| `CLOUDINARY_API_SECRET` | **Production**, Preview | Your Cloudinary API secret. Sourced from `.env.local`. |
| `AUTH_SECRET` | **Production**, Preview | A secure 32+ character string used to encrypt JWT cookies. |
| `NEXT_PUBLIC_APP_URL` | **Production** | Your production Vercel domain (e.g. `https://tourholic.vercel.app`). |

---

## 4. Preview and Development Environments

- **Preview Deployments**: If you open Pull Requests on GitHub and want Vercel to create live preview URLs with active database connectivity, check the **Preview** environment box when adding `MONGODB_URI`, `CLOUDINARY_*`, and `AUTH_SECRET`.
- **Local Development**: Your local machine uses the private `.env.local` file directly. You do not need Vercel CLI pull commands unless you choose to sync them.

---

## 5. Configuring MongoDB Atlas Network Access

Vercel functions run in serverless, dynamic cloud IP environments. For Vercel to communicate with your MongoDB Atlas cluster:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left navigation, select **Security → Network Access**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
5. Click **Confirm**.

> *Note*: If `0.0.0.0/0` is not active, your Vercel deployment will encounter database timeouts on live queries.

---

## 6. Configuring the Production Application URL

1. When Vercel first creates your deployment, it assigns a domain like `tourholic.vercel.app` (or `tourholic-<username>.vercel.app`).
2. Set `NEXT_PUBLIC_APP_URL` to that HTTPS URL:
   ```
   NEXT_PUBLIC_APP_URL=https://tourholic.vercel.app
   ```
3. If you later attach a custom domain (e.g. `https://www.touroholic.com`) under **Settings → Domains**, update `NEXT_PUBLIC_APP_URL` to reflect your custom domain.

---

## 7. Redeploying After Updating Environment Variables

When you add or edit environment variables in Vercel, existing running deployments **do not** automatically pick up changes. You must trigger a new deployment:

1. In your project dashboard, navigate to the **Deployments** tab.
2. Click the three dots (`...`) next to the latest deployment.
3. Click **Redeploy**.
4. Check **Redeploy with existing build cache** or rebuild fresh.
5. Alternatively, push any new commit to your `main` branch on GitHub, and Vercel will trigger a build with the new variables automatically.

---

## 8. Verifying Live Health Without Exposing Secrets

Touroholic includes built-in server-side health checks that verify external services without exposing credentials, connection strings, or secrets:

### A. Cloudinary Health Check
Visit the public URL in your browser:
```
https://<your-vercel-domain>/api/health/cloudinary
```
**Expected Response**:
```json
{
  "success": true,
  "service": "cloudinary",
  "status": "connected"
}
```

### B. MongoDB Atlas Health Check
Visit:
```
https://<your-vercel-domain>/api/health/mongodb
```
**Expected Response**:
```json
{
  "success": true,
  "service": "mongodb",
  "status": "connected"
}
```

If any variable is misconfigured or missing, the health check will return an HTTP 503 error indicating the status without printing private secrets.
