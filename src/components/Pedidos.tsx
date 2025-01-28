import React, { useState } from 'react';
import { Plus, Package, Check, X, Truck } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Producto, Pedido } from '../types';

export const Pedidos: React.FC = () => {
  const { user, productos, pedidos, crearPedido, actualizarPedido } = useStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [notas, setNotas] = useState('');

  const agregarAlCarrito = () => {
    const producto = productos.find(p => p.id === productoSeleccionado);
    if (!producto) return;

    setCarrito([...carrito, { producto, cantidad }]);
    setProductoSeleccionado('');
    setCantidad(1);
  };

  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const handleCrearPedido = async () => {
    if (carrito.length === 0) return;

    await crearPedido({
      fecha: new Date(),
      productos: carrito,
      estado: 'pendiente'
    });

    setCarrito([]);
    setNotas('');
    setMostrarFormulario(false);
  };

  const handleActualizarPedido = async (id: string, estado: Pedido['estado']) => {
    await actualizarPedido(id, estado, notas);
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (user?.role === 'admin') {
      return true;
    }
    if (user?.role === 'supplier') {
      return pedido.estado !== 'entregado';
    }
    return false;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {user?.role === 'supplier' ? 'Pedidos Pendientes' : 'Gestión de Pedidos'}
        </h2>
        {user?.role === 'admin' && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Nuevo Pedido
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nuevo Pedido</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} (Stock actual: {producto.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={agregarAlCarrito}
                disabled={!productoSeleccionado}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Agregar al Pedido
              </button>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Productos en el pedido:</h4>
                {carrito.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2"
                  >
                    <span>
                      {item.producto.nombre} x {item.cantidad}
                    </span>
                    <button
                      onClick={() => eliminarDelCarrito(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setCarrito([]);
                    setNotas('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearPedido}
                  disabled={carrito.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Crear Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {pedidosFiltrados.map((pedido) => (
          <div
            key={pedido.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Pedido del {new Date(pedido.fecha).toLocaleDateString()}
                </h3>
                <p className={`text-sm ${
                  pedido.estado === 'pendiente' ? 'text-yellow-600' :
                  pedido.estado === 'aprobado' ? 'text-blue-600' :
                  pedido.estado === 'rechazado' ? 'text-red-600' :
                  'text-green-600'
                }`}>
                  Estado: {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                </p>
              </div>
              {user?.role === 'supplier' && pedido.estado === 'pendiente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleActualizarPedido(pedido.id, 'aprobado')}
                    className="text-green-600 hover:text-green-700"
                    title="Aprobar pedido"
                  >
                    <Check className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleActualizarPedido(pedido.id, 'rechazado')}
                    className="text-red-600 hover:text-red-700"
                    title="Rechazar pedido"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              )}
              {user?.role === 'supplier' && pedido.estado === 'aprobado' && (
                <button
                  onClick={() => handleActualizarPedido(pedido.id, 'entregado')}
                  className="text-blue-600 hover:text-blue-700"
                  title="Marcar como entregado"
                >
                  <Truck className="h-6 w-6" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Productos solicitados:</h4>
              <div className="grid gap-2">
                {pedido.productos.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <Package className="h-5 w-5 text-gray-600" />
                    <span>
                      {item.producto.nombre} - {item.cantidad} unidades
                    </span>
                  </div>
                ))}
              </div>
              {pedido.notas && (
                <div className="mt-4">
                  <h4 className="font-medium">Notas:</h4>
                  <p className="text-gray-600">{pedido.notas}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {pedidosFiltrados.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No hay pedidos {user?.role === 'supplier' ? 'pendientes' : ''} en este momento
          </p>
        )}
      </div>
    </div>
  );
};