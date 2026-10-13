CREATE TABLE public.watchlist (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, show_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,show_id));
GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own list" ON public.watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Save own shows" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove own shows" ON public.watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);