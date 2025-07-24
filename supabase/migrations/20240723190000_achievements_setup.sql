-- Achievements System Setup

-- 1. Create the achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, 
  description text NOT NULL,
  icon_url text, 
  criteria jsonb NOT NULL 
);

-- 2. Create the user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id)
);

-- 3. Populate with some initial achievements
INSERT INTO public.achievements (name, description, icon_url, criteria)
VALUES
  ('First Steps', 'Send your first message to the tutor.', '/badges/first-message.png', '{"type": "messages_sent", "value": 1}'),
  ('Curious Mind', 'Send 10 messages.', '/badges/10-messages.png', '{"type": "messages_sent", "value": 10}'),
  ('Knowledge Seeker', 'Send 50 messages.', '/badges/50-messages.png', '{"type": "messages_sent", "value": 50}'),
  ('Level Up!', 'Reach level 2.', '/badges/level-2.png', '{"type": "level", "value": 2}'),
  ('Apprentice', 'Reach level 5.', '/badges/level-5.png', '{"type": "level", "value": 5}')
ON CONFLICT (name) DO NOTHING;

-- 4. Create a function to check and grant achievements
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(user_id_in uuid)
RETURNS TABLE (unlocked_achievement_name text, unlocked_achievement_description text, unlocked_achievement_icon_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data record;
  achievement_record record;
  messages_count int;
BEGIN
  -- Get user profile data
  SELECT * INTO profile_data FROM public.profiles WHERE id = user_id_in;
  
  -- Get user message count
  SELECT count(*) INTO messages_count FROM public.messages WHERE user_id = user_id_in;

  -- Loop through all achievements that the user doesn't have yet
  FOR achievement_record IN 
    SELECT * FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua 
      WHERE ua.user_id = user_id_in AND ua.achievement_id = a.id
    )
  LOOP
    -- Check criteria
    IF (achievement_record.criteria->>'type' = 'level' AND profile_data.level >= (achievement_record.criteria->>'value')::int) OR
       (achievement_record.criteria->>'type' = 'messages_sent' AND messages_count >= (achievement_record.criteria->>'value')::int)
    THEN
      -- Grant achievement
      INSERT INTO public.user_achievements (user_id, achievement_id) 
      VALUES (user_id_in, achievement_record.id)
      ON CONFLICT DO NOTHING;

      -- Return the newly unlocked achievement details
      unlocked_achievement_name := achievement_record.name;
      unlocked_achievement_description := achievement_record.description;
      unlocked_achievement_icon_url := achievement_record.icon_url;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- 5. Grant permissions
GRANT SELECT, INSERT ON public.achievements TO authenticated;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_grant_achievements(uuid) TO authenticated;

-- 6. Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Achievements are viewable by everyone." ON public.achievements
FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements." ON public.user_achievements
FOR SELECT USING (auth.uid() = user_id);
