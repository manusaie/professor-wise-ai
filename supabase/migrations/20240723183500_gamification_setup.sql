-- Gamification & Profile Customization Setup

-- 1. Add new columns to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create the storage bucket for avatars
-- Note: This needs to be done from the Supabase dashboard or via CLI.
-- This SQL just inserts the record, but the bucket itself must exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create the function to increment user stats
CREATE OR REPLACE FUNCTION public.increment_user_stats(user_id_in uuid, xp_increment integer, coins_increment integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_xp int;
  current_level int;
  new_xp int;
  new_level int;
  xp_for_next_level int;
BEGIN
  -- Get current xp and level
  SELECT xp, level INTO current_xp, current_level FROM public.profiles WHERE id = user_id_in;

  -- Calculate new xp and add coins
  new_xp := current_xp + xp_increment;
  UPDATE public.profiles
  SET coins = coins + coins_increment
  WHERE id = user_id_in;

  -- Check for level up
  xp_for_next_level := current_level * 100; -- Simple logic: 100xp per level
  new_level := current_level;

  IF new_xp >= xp_for_next_level THEN
    new_level := new_level + 1;
    new_xp := new_xp - xp_for_next_level; -- Reset XP for the new level
  END IF;

  -- Update profile with new xp and level
  UPDATE public.profiles
  SET 
    xp = new_xp,
    level = new_level
  WHERE id = user_id_in;

END;
$$;

-- 4. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.increment_user_stats(uuid, integer, integer) TO authenticated;

-- 5. Update RLS policies for the profiles table
-- Make sure to enable RLS on the table in the Supabase UI first.

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Recreate policies with new columns
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Enable realtime on the profiles table
-- This ensures the UI updates instantly.
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;


-- Final check: Ensure the profiles table has RLS enabled.
-- You can do this in the Supabase Dashboard under Authentication -> Policies.
