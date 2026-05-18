-- Create site-assets bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'site-assets');

-- Policies for authenticated uploads
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');