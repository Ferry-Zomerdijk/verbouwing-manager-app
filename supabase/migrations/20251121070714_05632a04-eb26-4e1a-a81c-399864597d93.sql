-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'project_user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create project_users table
CREATE TABLE public.project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;

-- 4. Create project_access_tokens table
CREATE TABLE public.project_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_access_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- 6. Create security definer function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.project_users 
    WHERE project_id = _project_id AND user_id = _user_id
  )
$$;

-- 7. RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. RLS policies for project_users
CREATE POLICY "Project owners and admins can view project users"
ON public.project_users FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_users.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Project owners and admins can invite users"
ON public.project_users FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_users.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Project owners and admins can remove users"
ON public.project_users FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_users.project_id 
    AND user_id = auth.uid()
  )
);

-- 9. RLS policies for project_access_tokens
CREATE POLICY "Only project owners and admins can create tokens"
ON public.project_access_tokens FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_access_tokens.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Tokens can be read by owners"
ON public.project_access_tokens FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_access_tokens.project_id 
    AND user_id = auth.uid()
  )
);

-- 10. Update projects RLS policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "Users can view accessible projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_project_access(auth.uid(), id)
);

-- 11. Update tasks RLS policies
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their projects" ON public.tasks;

CREATE POLICY "Users can view tasks of accessible projects"
ON public.tasks FOR SELECT
TO authenticated
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update tasks of accessible projects"
ON public.tasks FOR UPDATE
TO authenticated
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Project users can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND user_id = auth.uid())
);