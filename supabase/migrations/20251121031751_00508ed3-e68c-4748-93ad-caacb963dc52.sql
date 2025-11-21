-- Create admin_expenses table
CREATE TABLE IF NOT EXISTS public.admin_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.admin_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage their own expenses" 
ON public.admin_expenses 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_expenses_updated_at
BEFORE UPDATE ON public.admin_expenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();