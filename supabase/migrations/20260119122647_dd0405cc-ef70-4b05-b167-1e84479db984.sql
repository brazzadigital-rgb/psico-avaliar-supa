-- Add SMTP settings to site_settings
INSERT INTO public.site_settings (key, value)
VALUES ('smtp', '{"host": "", "port": 587, "username": "", "password": "", "from_name": "Psicoavaliar", "from_email": "", "encryption": "tls", "enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;