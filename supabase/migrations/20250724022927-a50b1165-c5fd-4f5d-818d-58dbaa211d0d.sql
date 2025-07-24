-- Fix the last remaining functions with missing search_path

-- Update is_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN auth.role() = 'service_role';
END;
$function$;

-- Update update_user_level function with proper search_path
CREATE OR REPLACE FUNCTION public.update_user_level()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_level INTEGER;
BEGIN
  new_level := public.calculate_level(NEW.total_xp);
  
  IF new_level != NEW.current_level THEN
    NEW.current_level := new_level;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;