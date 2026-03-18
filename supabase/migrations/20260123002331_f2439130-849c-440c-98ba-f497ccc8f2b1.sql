-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
CREATE POLICY "Users can view attachments from their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can upload attachments to their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments' 
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their organization attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' 
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
  )
);