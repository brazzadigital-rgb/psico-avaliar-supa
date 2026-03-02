-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'canceled', 'completed');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'receptionist', 'professional');

-- Create enum for modality
CREATE TYPE public.appointment_modality AS ENUM ('presencial', 'online');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Profiles table for admin users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 50,
    price DECIMAL(10, 2),
    modalities appointment_modality[] DEFAULT '{presencial, online}',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Professionals table
CREATE TABLE public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    registration_number TEXT,
    bio TEXT,
    specialties TEXT[],
    modalities appointment_modality[] DEFAULT '{presencial, online}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Professional services junction table
CREATE TABLE public.professional_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (professional_id, service_id)
);

-- Availability rules table
CREATE TABLE public.availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Time off / blocked dates
CREATE TABLE public.time_off_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date DATE,
    is_minor BOOLEAN DEFAULT false,
    guardian_name TEXT,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    end_time TIME NOT NULL,
    modality appointment_modality NOT NULL,
    status appointment_status DEFAULT 'pending' NOT NULL,
    reason_for_visit TEXT,
    online_meeting_link TEXT,
    internal_notes TEXT,
    canceled_reason TEXT,
    reminder_24h_sent BOOLEAN DEFAULT false,
    reminder_2h_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Contact messages table
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Function to check if user is any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'receptionist', 'professional')
  )
$$;

-- RLS Policies

-- User roles: only admins can manage
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users can see and update their own
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Services: public read, admin write
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Professionals: public read, admin write
CREATE POLICY "Anyone can view active professionals"
ON public.professionals FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage professionals"
ON public.professionals FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Professional services: public read, admin write
CREATE POLICY "Anyone can view professional services"
ON public.professional_services FOR SELECT
USING (true);

CREATE POLICY "Admins can manage professional services"
ON public.professional_services FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Availability: public read, admin write
CREATE POLICY "Anyone can view availability"
ON public.availability_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage availability"
ON public.availability_rules FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Time off: admin only
CREATE POLICY "Admins can manage time off"
ON public.time_off_blocks FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Clients: admin only
CREATE POLICY "Admins can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Appointments: public can insert (for booking), admin manages all
CREATE POLICY "Anyone can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view their appointment by code"
ON public.appointments FOR SELECT
USING (true);

-- Contact messages: public insert, admin read
CREATE POLICY "Anyone can send contact messages"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Function to generate appointment code
CREATE OR REPLACE FUNCTION public.generate_appointment_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := 'PSI-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  NEW.end_time := NEW.scheduled_time + (
    SELECT (duration_minutes || ' minutes')::INTERVAL 
    FROM public.services 
    WHERE id = NEW.service_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_appointment_code
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.generate_appointment_code();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert initial services
INSERT INTO public.services (name, description, duration_minutes, modalities, display_order) VALUES
('Avaliação Psicológica', 'Avaliação psicológica completa com laudo', 60, '{presencial, online}', 1),
('Avaliação Neuropsicológica', 'Avaliação neuropsicológica detalhada', 60, '{presencial}', 2),
('Psicoterapia Infantil', 'Atendimento psicológico para crianças', 50, '{presencial, online}', 3),
('Psicoterapia Adolescente', 'Atendimento psicológico para adolescentes', 50, '{presencial, online}', 4),
('Psicoterapia Adulto', 'Atendimento psicológico para adultos', 50, '{presencial, online}', 5),
('Terapia ABA', 'Terapia comportamental para TEA', 60, '{presencial}', 6),
('Consulta Psiquiatria', 'Consulta com psiquiatra', 30, '{presencial, online}', 7),
('Psicopedagogia', 'Atendimento psicopedagógico', 50, '{presencial, online}', 8);

-- Insert sample professional
INSERT INTO public.professionals (name, email, registration_number, bio, specialties, modalities) VALUES
('Equipe Psicoavaliar', 'centropsicoavaliar@gmail.com', NULL, 'Nossa equipe de profissionais especializados', '{Avaliação Psicológica, Psicoterapia, ABA}', '{presencial, online}');