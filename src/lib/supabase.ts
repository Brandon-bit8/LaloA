import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydjnahhzdhmbanqipmop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkam5haGh6ZGhtYmFucWlwbW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxNDY1MTIsImV4cCI6MjA0NzcyMjUxMn0.l3PTsMM3roHJ_iVUnNv29KsFzYr_f-pZSf-awDlBUlI';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const initializeTables = async () => {
  try {
    // Verificar si ya existen productos
    const { data: existingProducts } = await supabase
      .from('productos')
      .select('id')
      .limit(1);

    // Si no hay productos, insertar algunos por defecto
    if (!existingProducts || existingProducts.length === 0) {
      await supabase
        .from('productos')
        .insert([
          {
            id: crypto.randomUUID(),
            nombre: 'Cemento Portland',
            categoria: 'Materiales Básicos',
            precio: 15.99,
            stock: 100,
            minimo: 20
          },
          {
            id: crypto.randomUUID(),
            nombre: 'Ladrillos',
            categoria: 'Materiales Básicos',
            precio: 0.50,
            stock: 1000,
            minimo: 200
          },
          {
            id: crypto.randomUUID(),
            nombre: 'Varilla de Acero 3/8"',
            categoria: 'Acero',
            precio: 8.99,
            stock: 200,
            minimo: 50
          }
        ]);
    }
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

export const initializeUsers = async () => {
  try {
    // Admin user
    const { data: existingAdmin } = await supabase
      .from('users')
      .select()
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      await supabase
        .from('users')
        .insert([{
          id: crypto.randomUUID(),
          username: 'admin',
          password: 'admin',
          role: 'admin',
          name: 'Administrador',
          share_code: null
        }]);
    }

    // Supplier user
    const { data: existingSupplier } = await supabase
      .from('users')
      .select()
      .eq('username', 'inv')
      .single();

    if (!existingSupplier) {
      await supabase
        .from('users')
        .insert([{
          id: crypto.randomUUID(),
          username: 'inv',
          password: 'inv',
          role: 'supplier',
          name: 'Proveedor',
          share_code: null
        }]);
    }
  } catch (error) {
    console.error('Error in initializeUsers:', error);
  }
};