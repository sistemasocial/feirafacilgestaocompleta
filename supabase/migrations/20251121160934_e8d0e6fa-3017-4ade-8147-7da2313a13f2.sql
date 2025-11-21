-- Allow admins to insert notifications for any user
CREATE POLICY "Admins can insert notifications for users"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));