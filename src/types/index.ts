export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  minimo: number;
}

export interface Venta {
  id: string;
  fecha: Date;
  productos: {
    producto: Producto;
    cantidad: number;
  }[];
  total: number;
}

export interface Pedido {
  id: string;
  fecha: Date;
  productos: {
    producto: Producto;
    cantidad: number;
  }[];
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'entregado';
  notas?: string;
}