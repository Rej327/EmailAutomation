# 📧 Email Automation & Bulk Sender Web App - Setup & User Guide

Welcome to the **Email Automation & Bulk Sender** application. This project is built with **Next.js 15 (App Router, TypeScript)**, **Prisma ORM**, **Supabase** (Auth, Database & Storage), and **Resend** (Email Delivery), featuring automated timely scheduling, bulk email processing, image embedding, field-locking safety controls, and a modern dashboard.

---

## ⚡ Quick Start (Demo / Mock Mode)

The application includes an **intelligent Mock / Demo fallback**:
- When environment variables are set to their default placeholders, the app runs in **Demo Mode**.
- You can test sending bulk emails, scheduling automation, toggling the field-locking controls, and importing images immediately without any third-party credentials!
- Delivered emails, logs, and scheduled tasks are simulated and displayed in the real-time activity feed and Sent History table.

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

---

## 🛠️ Production Setup (Live Supabase & Resend)

To send real emails to inboxes and store persistent data in your own cloud database, follow these steps:

### 1. Supabase Setup (Database, Auth & Storage)

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In your Supabase Project Settings:
   - Go to **Project Settings -> API**.
   - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
   - Copy **anon public** API key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
   - Copy **service_role secret** key into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. In your Supabase Dashboard, open the **SQL Editor**:
   - Open `supabase_schema.sql` located in the root of this project.
   - Paste the SQL script and click **Run**.
   - This creates:
     - `campaigns` table
     - `email_logs` table
     - `email_assets` table
     - Row Level Security (RLS) policies
     - Public `email-assets` Storage Bucket for hosted email images.

### 2. Prisma ORM Database Connection

1. In your Supabase Project Settings:
   - Go to **Project Settings -> Database -> Connection string**.
   - Select **URI** mode.
   - Copy the PostgreSQL connection URI and set it as `DATABASE_URL` in `.env.local`:
     ```env
     DATABASE_URL="postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
2. Generate the Prisma Client and sync models:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### 3. Resend API Setup (Email Delivery)

1. Go to [https://resend.com](https://resend.com) and create a free account.
2. Go to **API Keys** -> **Create API Key**.
3. Copy the key (starts with `re_`) into `RESEND_API_KEY` in `.env.local`.
4. *Important note on senders*:
   - Resend allows sending test emails from `onboarding@resend.dev` to your registered account email right away.
   - To send emails from `jeffdev2701@gmail.com` or your own custom domain (e.g., `newsletter@yourdomain.com`), verify your domain in the **Domains** tab in Resend by adding the DNS records.
   - You can configure the default sender in `.env.local`:
     ```env
     NEXT_PUBLIC_DEFAULT_SENDER_EMAIL="jeffdev2701@gmail.com"
     ```

---

## 🚀 Key Application Features

### 1. 🔒 Lockable Fields & Auto-Send Protection
- **Default Sender**: Set to `jeffdev2701@gmail.com`.
- **Auto-Send Switch**: Turning on the "Auto Send" toggle arms the automated scheduler (either at a scheduled date/time or immediate periodic dispatch).
- **Field Locking**: When **Auto Send is ON**, all fields (**Sender, Bulk Receivers, Subject, and Content**) are automatically locked to prevent accidental modifications while automation is active. A prominent visual lock badge and padlock icons appear on each input.
- To edit any field, simply toggle **Auto Send OFF** to make edits, then turn it back on.

### 2. 👥 Bulk Recipient Engine
- Paste multiple comma-separated emails, space-separated, or newline-separated addresses.
- Auto-validation detects valid email addresses, counts total recipients, and highlights invalid formats.
- Supports instant recipient chips removal and quick presets.

### 3. 🖼️ Image Uploader & Embed Link Generator
- Click **"Import Image"** to choose or drag an image.
- The app automatically uploads it (to Supabase Storage or generates a fast CDN/data URL), renders an embeddable image snippet, and inserts it directly into the email body:
  ```html
  <img src="https://..." alt="Email Image" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />
  ```
- The email preview immediately renders the image live so you know exactly how it will appear in client inboxes!

### 4. 📱 Live Email Preview (Desktop & Mobile)
- Switch seamlessly between **Desktop** and **Mobile** viewports.
- Renders rich typography, custom headers, call-to-action buttons, embedded images, and professional email container layouts.

### 5. ⏱️ Automation Scheduler & Manual Dispatch
- **Send Now**: Immediate dispatch to all bulk recipients via Resend batch API.
- **Timely Schedule**: Pick a date and time in the future for automated dispatch.
- **Sent History & Logs**: Complete audit log of every email sent with delivery status (`SENT`, `SCHEDULED`, `FAILED`), timestamps, and recipient counts.

---

## 📂 Project Structure

```
EmailAutomation/
├── prisma/
│   └── schema.prisma         # Prisma data models (User, Campaign, EmailLog, EmailAsset)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # Supabase Auth endpoints (login, register, session)
│   │   │   ├── campaigns/    # Campaign CRUD endpoints
│   │   │   ├── schedule/     # Automation scheduler trigger endpoint
│   │   │   ├── send-email/   # Resend delivery & batch dispatch API
│   │   │   └── upload-image/ # Supabase Storage image upload API
│   │   ├── layout.tsx        # Root layout with Toaster provider & Inter font
│   │   └── page.tsx          # Main dashboard page
│   ├── components/
│   │   ├── AuthModal.tsx     # Supabase Auth modal (username & password)
│   │   ├── CampaignHistory.tsx # Sent logs and campaign history table
│   │   ├── EmailComposer.tsx # Core composer with lockable fields & auto-send toggle
│   │   ├── EmailPreview.tsx  # Live desktop/mobile email rendering frame
│   │   ├── ImageModal.tsx    # Image upload & link insertion modal
│   │   └── Navbar.tsx        # Header with status pills, demo badge & user profile
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── resend.ts         # Resend SDK helper & mock fallback
│   │   └── supabase.ts       # Supabase client singleton & auth helpers
│   └── styles/
│       └── globals.css       # Bespoke design system (dark/light, glassmorphism, animations)
├── .env.example              # Environment variables template
├── .env.local                # Local environment with placeholder defaults
├── package.json              # App dependencies & scripts
├── supabase_schema.sql       # Supabase database & storage SQL schema
└── tsconfig.json             # TypeScript configuration
```

---

## ❓ Frequently Asked Questions

**Q: Can I test sending without a real Resend key?**  
Yes! When `RESEND_API_KEY` contains the default placeholder, the system runs in Demo Mode, creating realistic simulated delivery logs and visual confirmations via Sonner toasts.

**Q: Can I use a username instead of an email to log in?**  
Yes! The authentication modal allows you to log in with a username and password. If an email is omitted, it automatically handles a dummy internal email (e.g. `username@app.local`) compatible with Supabase Auth.

**Q: How do I unlock the form fields?**  
Turn off the **Auto Send** switch. When the switch is deactivated, all form fields become fully editable.
