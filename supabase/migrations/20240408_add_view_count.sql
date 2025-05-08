-- Add view_count column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS posts_view_count_idx ON public.posts (view_count);
