-- Fix function search paths for security compliance

-- Update calculate_level function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Simple level calculation: every 100 XP = 1 level
  RETURN GREATEST(1, (xp / 100) + 1);
END;
$function$;

-- Update increment_user_stats function with proper search_path
CREATE OR REPLACE FUNCTION public.increment_user_stats(user_id_in uuid, xp_increment integer DEFAULT 0, coins_increment integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    INSERT INTO profiles (id, xp, coins, level)
    VALUES (user_id_in, xp_increment, coins_increment, 1)
    ON CONFLICT (id) DO UPDATE SET 
        xp = profiles.xp + xp_increment,
        coins = profiles.coins + coins_increment,
        level = GREATEST(1, (profiles.xp + xp_increment) / 100 + 1),
        updated_at = NOW();
END;
$function$;

-- Update check_and_grant_achievements function with proper search_path
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(user_id_in uuid)
 RETURNS TABLE(unlocked_achievement_name text, unlocked_achievement_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    user_profile RECORD;
    achievement_record RECORD;
    message_count INTEGER;
BEGIN
    SELECT * INTO user_profile FROM profiles WHERE id = user_id_in;
    IF user_profile IS NULL THEN RETURN; END IF;

    SELECT COUNT(*) INTO message_count FROM messages WHERE user_id = user_id_in AND sender = 'user';

    FOR achievement_record IN 
        SELECT a.* FROM achievements a
        WHERE NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = user_id_in AND ua.achievement_id = a.id
        )
        AND (
            (a.requirement_type = 'xp' AND user_profile.xp >= a.requirement_value) OR
            (a.requirement_type = 'messages' AND message_count >= a.requirement_value)
        )
    LOOP
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (user_id_in, achievement_record.id);
        unlocked_achievement_name := achievement_record.name;
        unlocked_achievement_description := achievement_record.description;
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$function$;

-- Update set_updated_at_profiles function with proper search_path
CREATE OR REPLACE FUNCTION public.set_updated_at_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;