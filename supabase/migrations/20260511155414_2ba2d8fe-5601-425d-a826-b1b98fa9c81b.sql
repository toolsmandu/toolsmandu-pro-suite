INSERT INTO public.custom_templates (name, slug, template_type, data, is_active)
VALUES ('Big Products Cards', 'big-products-cards', 'big_products_cards', '{"eyebrow":"","heading":"","subheading":"","columns":4,"items":[]}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM public.custom_templates WHERE template_type = 'adobe_style_cards';