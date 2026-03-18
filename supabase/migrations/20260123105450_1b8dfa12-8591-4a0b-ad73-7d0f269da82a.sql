-- Drop the existing constraint and add a new one with the correct types
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_entity_type_check;

-- Add new constraint with the types used in the application
ALTER TABLE public.attachments ADD CONSTRAINT attachments_entity_type_check 
  CHECK (entity_type = ANY (ARRAY[
    'vehicle'::text, 
    'trip'::text, 
    'fuel_record'::text, 
    'expense'::text, 
    'maintenance'::text, 
    'driver'::text,
    'nota_fiscal'::text,
    'comprovante'::text,
    'documento'::text,
    'foto'::text
  ]));