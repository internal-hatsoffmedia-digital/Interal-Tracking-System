-- Align task categories with the production form. Additive only; no access policy changes.
alter type public.task_category add value if not exists 'graphic_design';
alter type public.task_category add value if not exists 'social_media_handling';
alter type public.task_category add value if not exists 'content_writing';
alter type public.task_category add value if not exists 'reel_story_writing';
alter type public.task_category add value if not exists 'ads_management';
alter type public.task_category add value if not exists 'wordpress_development';
alter type public.task_category add value if not exists 'custom_coding';
alter type public.task_category add value if not exists 'website_deployment';
alter type public.task_category add value if not exists 'website_maintenance';
notify pgrst, 'reload schema';
