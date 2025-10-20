-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE project_status AS ENUM ('Gepland', 'Lopend', 'Afgerond');
CREATE TYPE task_status AS ENUM ('Te doen', 'Bezig', 'Gereed');
CREATE TYPE task_priority AS ENUM ('Laag', 'Middel', 'Hoog');
CREATE TYPE cost_category AS ENUM ('Materiaal', 'Arbeid', 'Vergunningen', 'Overig');
CREATE TYPE document_type AS ENUM ('Offerte', 'Vergunning', 'Handleiding', 'Garantie', 'Contract', 'Overig');
CREATE TYPE photo_phase AS ENUM ('Voor', 'Tijdens', 'Na');
CREATE TYPE user_role AS ENUM ('Eigenaar', 'Partner', 'Aannemer', 'Adviseur');
CREATE TYPE notification_type AS ENUM ('Taak', 'Budget', 'Document');

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  type TEXT,
  status project_status DEFAULT 'Gepland',
  startdatum DATE,
  einddatum DATE,
  beschrijving TEXT,
  totaal_begroting DECIMAL(10,2) DEFAULT 0,
  werkelijke_kosten DECIMAL(10,2) DEFAULT 0,
  voortgang INTEGER DEFAULT 0 CHECK (voortgang >= 0 AND voortgang <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschrijving TEXT,
  deadline DATE,
  status task_status DEFAULT 'Te doen',
  prioriteit task_priority DEFAULT 'Middel',
  verantwoordelijke TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create costs table
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  bedrag DECIMAL(10,2) NOT NULL,
  leverancier TEXT,
  categorie cost_category NOT NULL,
  factuur_url TEXT,
  ocr_herkenning JSONB,
  koppeling_begrotingspost TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  bestandsnaam TEXT NOT NULL,
  bestand_url TEXT NOT NULL,
  upload_datum TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fase photo_phase NOT NULL,
  afbeelding_url TEXT NOT NULL,
  notitie TEXT,
  herkende_objecten JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contractors table
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  telefoon TEXT,
  email TEXT,
  bedrijf TEXT,
  rol TEXT,
  notities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  naam TEXT,
  email TEXT,
  rol user_role DEFAULT 'Eigenaar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  bericht TEXT NOT NULL,
  type notification_type NOT NULL,
  gelezen BOOLEAN DEFAULT FALSE,
  datum TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks of their projects"
  ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create tasks for their projects"
  ON tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update tasks of their projects"
  ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete tasks of their projects"
  ON tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for costs
CREATE POLICY "Users can view costs of their projects"
  ON costs FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = costs.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create costs for their projects"
  ON costs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = costs.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update costs of their projects"
  ON costs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = costs.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete costs of their projects"
  ON costs FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = costs.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view documents of their projects"
  ON documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create documents for their projects"
  ON documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete documents of their projects"
  ON documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for photos
CREATE POLICY "Users can view photos of their projects"
  ON photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = photos.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create photos for their projects"
  ON photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = photos.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete photos of their projects"
  ON photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = photos.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for contractors
CREATE POLICY "Users can view contractors of their projects"
  ON contractors FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contractors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create contractors for their projects"
  ON contractors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = contractors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update contractors of their projects"
  ON contractors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contractors.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete contractors of their projects"
  ON contractors FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contractors.project_id AND projects.user_id = auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, naam, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'naam', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update project costs
CREATE OR REPLACE FUNCTION update_project_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET werkelijke_kosten = (
    SELECT COALESCE(SUM(bedrag), 0)
    FROM costs
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project costs automatically
CREATE TRIGGER update_costs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON costs
  FOR EACH ROW EXECUTE FUNCTION update_project_costs();