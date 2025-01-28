-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with supplier role
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'supplier')),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create productos table
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  minimo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create ventas table
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  productos JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create pedidos table for supplier functionality
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  productos JSONB NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'entregado')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables to update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at
    BEFORE UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Public users select" ON users FOR SELECT USING (true);
CREATE POLICY "Public users insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Create policies for productos
CREATE POLICY "Public productos select" ON productos FOR SELECT USING (true);
CREATE POLICY "Admin and supplier manage productos" ON productos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'supplier')
  )
);

-- Create policies for ventas
CREATE POLICY "Public ventas select" ON ventas FOR SELECT USING (true);
CREATE POLICY "Users can create ventas" ON ventas FOR INSERT WITH CHECK (true);

-- Create policies for pedidos
CREATE POLICY "Public pedidos select" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Admin and supplier manage pedidos" ON pedidos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'supplier')
  )
);

-- Insert default users (admin and supplier)
INSERT INTO users (id, username, password, role, name) VALUES 
  (uuid_generate_v4(), 'admin', 'admin', 'admin', 'Administrador'),
  (uuid_generate_v4(), 'inv', 'inv', 'supplier', 'Proveedor')
ON CONFLICT (username) DO NOTHING;

-- Insert sample productos
INSERT INTO productos (id, nombre, categoria, precio, stock, minimo) VALUES 
  (uuid_generate_v4(), 'Cemento Portland', 'Materiales Básicos', 15.99, 100, 20),
  (uuid_generate_v4(), 'Ladrillos', 'Materiales Básicos', 0.50, 1000, 200),
  (uuid_generate_v4(), 'Varilla de Acero 3/8"', 'Acero', 8.99, 200, 50)
ON CONFLICT DO NOTHING;