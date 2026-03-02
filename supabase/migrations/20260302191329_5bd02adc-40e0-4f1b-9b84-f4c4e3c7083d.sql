-- Remove the duplicate 'client' role for the user who is already 'admin'
DELETE FROM public.user_roles 
WHERE user_id = '06b612b7-fdb0-408d-8e19-ff43d0b7bcfc' 
  AND role = 'client';