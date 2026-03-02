-- Remove the incorrectly saved Tuesday date (03/03) caused by timezone bug
DELETE FROM public.date_overrides WHERE override_date = '2026-03-03';