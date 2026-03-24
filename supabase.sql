-- Migration for Barber System with Multi-tenancy support

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  personal_phone TEXT,
  photo TEXT,
  shop_name TEXT,
  business_phone TEXT,
  address TEXT,
  logo TEXT,
  description TEXT,
  instagram TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  cut_count INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, phone)
);

-- Customer Photos table
CREATE TABLE IF NOT EXISTS customer_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  customer_phone TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id, customer_phone) REFERENCES customers(user_id, phone) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, no-show
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Schedule table
CREATE TABLE IF NOT EXISTS weekly_schedule (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  day_of_week INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '19:00',
  is_open BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, day_of_week)
);

-- Weekly Breaks table
CREATE TABLE IF NOT EXISTS weekly_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  day_of_week INTEGER NOT NULL,
  time TIME NOT NULL,
  FOREIGN KEY (user_id, day_of_week) REFERENCES weekly_schedule(user_id, day_of_week) ON DELETE CASCADE,
  UNIQUE(user_id, day_of_week, time)
);

-- Blocked Slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  UNIQUE(user_id, date, time)
);

-- Unblocked Slots table
CREATE TABLE IF NOT EXISTS unblocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  UNIQUE(user_id, date, time)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE unblocked_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "usuario_le_proprios_dados" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "usuario_insere_proprios_dados" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "usuario_deleta_proprios_dados" ON profiles FOR DELETE USING (auth.uid() = id);

-- Services
CREATE POLICY "usuario_le_proprios_dados" ON services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON services FOR DELETE USING (auth.uid() = user_id);

-- Customers
CREATE POLICY "usuario_le_proprios_dados" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON customers FOR DELETE USING (auth.uid() = user_id);

-- Customer Photos
CREATE POLICY "usuario_le_proprios_dados" ON customer_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON customer_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON customer_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON customer_photos FOR DELETE USING (auth.uid() = user_id);

-- Appointments
CREATE POLICY "usuario_le_proprios_dados" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Weekly Schedule
CREATE POLICY "usuario_le_proprios_dados" ON weekly_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON weekly_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON weekly_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON weekly_schedule FOR DELETE USING (auth.uid() = user_id);

-- Weekly Breaks
CREATE POLICY "usuario_le_proprios_dados" ON weekly_breaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON weekly_breaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON weekly_breaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON weekly_breaks FOR DELETE USING (auth.uid() = user_id);

-- Blocked Slots
CREATE POLICY "usuario_le_proprios_dados" ON blocked_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON blocked_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON blocked_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON blocked_slots FOR DELETE USING (auth.uid() = user_id);

-- Unblocked Slots
CREATE POLICY "usuario_le_proprios_dados" ON unblocked_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usuario_insere_proprios_dados" ON unblocked_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usuario_atualiza_proprios_dados" ON unblocked_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usuario_deleta_proprios_dados" ON unblocked_slots FOR DELETE USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
