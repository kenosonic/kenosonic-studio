-- Add archived flag to documents (omitted from initial migration)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
