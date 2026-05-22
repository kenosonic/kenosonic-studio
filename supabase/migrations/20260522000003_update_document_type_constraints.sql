-- Drop any existing type check constraints on the documents table
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

-- Drop any existing status check constraints on the documents table
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.documents'::regclass
      AND contype = 'c'
      AND conname ILIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.documents DROP CONSTRAINT ' || quote_ident(cname);
  END LOOP;
END $$;

-- Re-add type constraint with all current document types
ALTER TABLE public.documents
  ADD CONSTRAINT documents_type_check CHECK (type IN (
    'invoice','quote','proposal','contract','report','audit',
    'email','offboarding','questionnaire','discovery'
  ));

-- Re-add status constraint with all current statuses (including completed)
ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check CHECK (status IN (
    'draft','sent','viewed','approved','signed','rejected','completed'
  ));
