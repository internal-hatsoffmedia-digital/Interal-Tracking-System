alter type public.task_category add value if not exists 'gmb_audit';
alter type public.task_category add value if not exists 'seo_audit';
alter type public.task_category add value if not exists 'website_audit';
alter type public.task_category add value if not exists 'whisk';
notify pgrst,'reload schema';
