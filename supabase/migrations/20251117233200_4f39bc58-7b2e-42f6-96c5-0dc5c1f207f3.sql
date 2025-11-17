-- Add created_by field to feiras table to track which admin created each feira
ALTER TABLE public.feiras 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Update existing feiras to be owned by the first admin
UPDATE public.feiras
SET created_by = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;