-- Create admin_settings table to store configuration like revenue goals
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  revenue_goal NUMERIC DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage their settings
CREATE POLICY "Admins can manage their own settings"
ON public.admin_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings for existing admins
INSERT INTO public.admin_settings (user_id, revenue_goal)
SELECT ur.user_id, 10000
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;