-- Drop existing type check constraint on documents table
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.documents'::regclass
      AND contype = 'c'
      AND conname ILIKE '%type%'
  LOOP
    EXECUTE 'ALTER TABLE public.documents DROP CONSTRAINT ' || quote_ident(cname);
  END LOOP;
END $$;

-- Re-add type constraint including spec
ALTER TABLE public.documents
  ADD CONSTRAINT documents_type_check CHECK (type IN (
    'invoice','quote','proposal','contract','report','audit',
    'email','offboarding','questionnaire','discovery','spec'
  ));
