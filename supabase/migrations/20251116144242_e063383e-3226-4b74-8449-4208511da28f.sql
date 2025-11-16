-- Add CPF column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'feirante'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'feirante')::app_role;
  
  -- Insert into profiles table with all fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    whatsapp,
    cpf,
    feiras_por_semana,
    media_feirantes_por_feira
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'cpf',
    CASE 
      WHEN user_role = 'admin' THEN (NEW.raw_user_meta_data->>'feiras_por_semana')::INTEGER
      ELSE NULL
    END,
    CASE 
      WHEN user_role = 'admin' THEN (NEW.raw_user_meta_data->>'media_feirantes')::INTEGER
      ELSE NULL
    END
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;