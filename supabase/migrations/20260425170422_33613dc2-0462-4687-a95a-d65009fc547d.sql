
-- Enums
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending','in_progress','completed','skipped','overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_recurrence_type AS ENUM ('daily','weekly','monthly','every_x_days');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- task_templates
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  recurrence_type public.task_recurrence_type NOT NULL,
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_time TIME NOT NULL DEFAULT '17:00',
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_generated_for DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage task templates" ON public.task_templates
  FOR ALL USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Editors view assigned templates" ON public.task_templates
  FOR SELECT USING (has_role(auth.uid(),'editor') AND assigned_to = auth.uid());

CREATE TRIGGER trg_task_templates_updated
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_task_templates_assigned ON public.task_templates(assigned_to);
CREATE INDEX idx_task_templates_active ON public.task_templates(is_paused, start_date);

-- tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  overdue_alert_sent_at TIMESTAMPTZ,
  completion_alert_sent_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tasks" ON public.tasks
  FOR ALL USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Editors view own tasks" ON public.tasks
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Editors update own tasks" ON public.tasks
  FOR UPDATE USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due ON public.tasks(due_at);
CREATE INDEX idx_tasks_template ON public.tasks(template_id);

-- Trigger: completed_at + status logic
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    ELSIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
      NEW.completed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tasks_completed_at
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();

CREATE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- task_comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage task comments" ON public.task_comments
  FOR ALL USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Editors view own task comments" ON public.task_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_comments.task_id AND t.assigned_to = auth.uid())
  );

CREATE POLICY "Editors comment on own tasks" ON public.task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_comments.task_id AND t.assigned_to = auth.uid())
  );

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

-- task_activity_logs
CREATE TABLE public.task_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.task_templates(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all task activity" ON public.task_activity_logs
  FOR SELECT USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins insert task activity" ON public.task_activity_logs
  FOR INSERT WITH CHECK (has_role(auth.uid(),'admin') OR actor_id = auth.uid());

CREATE POLICY "Editors view own task activity" ON public.task_activity_logs
  FOR SELECT USING (
    task_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_activity_logs.task_id AND t.assigned_to = auth.uid())
  );

CREATE POLICY "Editors insert activity on own tasks" ON public.task_activity_logs
  FOR INSERT WITH CHECK (
    actor_id = auth.uid() AND
    task_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_activity_logs.task_id AND t.assigned_to = auth.uid())
  );

CREATE INDEX idx_task_activity_task ON public.task_activity_logs(task_id);
CREATE INDEX idx_task_activity_template ON public.task_activity_logs(template_id);

-- Seed editable email templates for tasks (admin can tweak in Settings → Email Templates)
INSERT INTO public.email_templates (template_key, display_name, category, fields) VALUES
  ('tasks_daily_digest','Tasks — Daily Digest (Editor)','transactional',
    jsonb_build_object(
      'subject','Your tasks for today',
      'heading','Your tasks for today',
      'sub_message','Here are the tasks scheduled for you today. Please complete them by the end of the day.',
      'cta_label','View My Tasks'
    )),
  ('tasks_overdue_alert','Tasks — Overdue Alert','transactional',
    jsonb_build_object(
      'subject','Task is overdue',
      'heading','A task is overdue',
      'sub_message','The following task is past its due date and still not completed.',
      'cta_label','Open Task'
    )),
  ('tasks_completed_admin','Tasks — Completed (Admin)','transactional',
    jsonb_build_object(
      'subject','A task has been completed',
      'heading','Task completed',
      'sub_message','An editor has just marked a task as completed.',
      'cta_label','View Task'
    ))
ON CONFLICT (template_key) DO NOTHING;
