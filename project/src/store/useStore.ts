import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Producto, Venta, Pedido } from '../types';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'client' | 'supplier';
  name: string;
  shareCode?: string;
}

interface Estado {
  user: User | null;
  productos: Producto[];
  ventas: Venta[];
  pedidos: Pedido[];
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithCode: (code: string) => Promise<void>;
  generateShareCode: () => Promise<string>;
  loadData: () => Promise<void>;
  agregarProducto: (producto: Omit<Producto, 'id'>) => Promise<void>;
  actualizarProducto: (id: string, producto: Producto) => Promise<void>;
  registrarVenta: (venta: Omit<Venta, 'id'>) => Promise<void>;
  crearPedido: (pedido: Omit<Pedido, 'id'>) => Promise<void>;
  actualizarPedido: (id: string, estado: Pedido['estado'], notas?: string) => Promise<void>;
  obtenerEstadisticas: () => { fecha: string; ventas: number; }[];
}

export const useStore = create<Estado>((set, get) => ({
  user: null,
  productos: [],
  ventas: [],
  pedidos: [],
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      set({
        user: {
          id: data.id,
          username: data.username,
          role: data.role,
          name: data.name,
          shareCode: data.share_code
        },
        isLoading: false
      });

      await get().loadData();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  register: async (username: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: crypto.randomUUID(),
          username,
          password,
          role: 'client',
          name
        }])
        .select()
        .single();

      if (error || !data) {
        throw new Error('Error al registrar usuario');
      }

      set({
        user: {
          id: data.id,
          username: data.username,
          role: 'client',
          name: data.name
        },
        isLoading: false
      });

      await get().loadData();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ 
      user: null, 
      productos: [], 
      ventas: [], 
      pedidos: [],
      isLoading: false, 
      error: null 
    });
  },

  loginWithCode: async (code: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select()
        .eq('share_code', code)
        .single();

      if (userError || !userData) {
        throw new Error('Código de acceso inválido');
      }

      set({
        user: {
          id: userData.id,
          username: userData.username,
          role: userData.role,
          name: userData.name,
          shareCode: userData.share_code
        },
        isLoading: false
      });

      await get().loadData();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  generateShareCode: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const shareCode = crypto.randomUUID().split('-')[0];
      const { user } = get();

      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('users')
        .update({ share_code: shareCode })
        .eq('id', user.id);

      if (error) throw error;

      set(state => ({
        user: state.user ? { ...state.user, shareCode } : null,
        isLoading: false
      }));

      return shareCode;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  loadData: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const [productosRes, ventasRes, pedidosRes] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('ventas').select('*'),
        supabase.from('pedidos').select('*')
      ]);

      set({ 
        productos: productosRes.data || [],
        ventas: ventasRes.data || [],
        pedidos: pedidosRes.data || []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  agregarProducto: async (producto) => {
    try {
      const productoConId = {
        ...producto,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('productos')
        .insert([productoConId])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        productos: [...state.productos, data]
      }));
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  actualizarProducto: async (id, producto) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update(producto)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        productos: state.productos.map(p => p.id === id ? producto : p)
      }));
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  registrarVenta: async (venta) => {
    try {
      const ventaConId = {
        ...venta,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('ventas')
        .insert([ventaConId])
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock
      for (const item of venta.productos) {
        const producto = item.producto;
        await supabase
          .from('productos')
          .update({ stock: producto.stock - item.cantidad })
          .eq('id', producto.id);
      }

      set(state => ({
        ventas: [...state.ventas, data],
        productos: state.productos.map(producto => {
          const ventaItem = venta.productos.find(item => item.producto.id === producto.id);
          if (ventaItem) {
            return {
              ...producto,
              stock: producto.stock - ventaItem.cantidad
            };
          }
          return producto;
        })
      }));
    } catch (error) {
      console.error('Error registering sale:', error);
      throw error;
    }
  },

  crearPedido: async (pedido) => {
    try {
      const pedidoConId = {
        ...pedido,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('pedidos')
        .insert([pedidoConId])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        pedidos: [...state.pedidos, data]
      }));
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  actualizarPedido: async (id, estado, notas) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado, notas })
        .eq('id', id);

      if (error) throw error;

      // Si el pedido fue entregado, actualizar el stock
      if (estado === 'entregado') {
        const pedido = get().pedidos.find(p => p.id === id);
        if (pedido) {
          for (const item of pedido.productos) {
            const producto = item.producto;
            await supabase
              .from('productos')
              .update({ 
                stock: producto.stock + item.cantidad 
              })
              .eq('id', producto.id);
          }
        }
      }

      set(state => ({
        pedidos: state.pedidos.map(pedido => 
          pedido.id === id ? { ...pedido, estado, notas } : pedido
        )
      }));
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  obtenerEstadisticas: () => {
    const { ventas } = get();
    return ventas.reduce((acc: { fecha: string; ventas: number; }[], venta) => {
      const fecha = new Date(venta.fecha).toLocaleDateString();
      const existente = acc.find((item) => item.fecha === fecha);
      
      if (existente) {
        existente.ventas += venta.total;
      } else {
        acc.push({ fecha, ventas: venta.total });
      }
      
      return acc;
    }, []);
  },
}));