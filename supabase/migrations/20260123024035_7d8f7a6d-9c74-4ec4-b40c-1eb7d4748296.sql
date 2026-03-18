-- Update the attachments bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'attachments';