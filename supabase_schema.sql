-- ==============================================================================
-- Supabase Schema for Email Automation & Bulk Sender Web App
-- ==============================================================================

-- 1. Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender TEXT NOT NULL DEFAULT 'jeffdev2701@gmail.com',
    recipients TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    is_auto_send BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED', 'SCHEDULED', 'QUEUED'
    resend_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create email_assets table for uploaded images
CREATE TABLE IF NOT EXISTS public.email_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_assets ENABLE ROW LEVEL SECURITY;

-- 5. Open access policies for authenticated users or public service (customizable)
CREATE POLICY "Allow select for all authenticated users" ON public.campaigns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert/update for all authenticated users" ON public.campaigns
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow select for email logs" ON public.email_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for email logs" ON public.email_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow select for email assets" ON public.email_assets
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow insert for email assets" ON public.email_assets
    FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Setup Storage Bucket for Email Image Assets
-- Run this in Supabase SQL editor to create the public bucket:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to images in email-assets bucket
CREATE POLICY "Public Access to Email Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Allow authenticated uploads to email-assets bucket
CREATE POLICY "Authenticated Users can upload Email Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');
