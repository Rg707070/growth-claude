-- Book Links Schema
-- Polymorphic links between reading_books and any summary/note source.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.book_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  book_id     uuid        NOT NULL REFERENCES public.reading_books (id) ON DELETE CASCADE,
  source_type text        NOT NULL CHECK (source_type IN ('learning_summary','journal_document','journal_entry')),
  source_id   uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, source_type, source_id)
);

ALTER TABLE public.book_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_book_links" ON public.book_links;
CREATE POLICY "users_own_book_links"
  ON public.book_links FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS book_links_book ON public.book_links (book_id);
CREATE INDEX IF NOT EXISTS book_links_source ON public.book_links (user_id, source_type, source_id);
