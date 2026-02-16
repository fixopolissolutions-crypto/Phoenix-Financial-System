import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';

export default function Servidor() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'servicios' | 'pedidos'>('servicios');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Queries
  const { data: services, refetch: refetchServices } = trpc.server.getServices.useQuery({
    tienda: user?.tienda
  });

  const { data: orders, refetch: refetchOrders } = trpc.server.getOrders.useQuery({
    tienda: user?.tienda
  });

  const { data: accountInfo } = trpc.server.getAccountInfo.useQuery();

  // Mutations
  const syncServicesMutation = trpc.server.syncServices.useMutation({
    onSuccess: () => {
      toast.success('Servicios sincronizados exitosamente');
      refetchServices();
    },
    onError: (error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    }
  });

  const createOrderMutation = trpc.server.createOrder.useMutation({
    onSuccess: () => {
      toast.success('Pedido creado exitosamente');
      setShowNewOrderModal(false);
      setSelectedService(null);
      refetchOrders();
    },
    onError: (error) => {
      toast.error(`Error al crear pedido: ${error.message}`);
    }
  });

  const handleSyncServices = () => {
    if (confirm('¿Deseas sincronizar los servicios desde UnlockerFast? Esto puede tardar unos segundos.')) {
      syncServicesMutation.mutate();
    }
  };

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createOrderMutation.mutate({
      serviceId: selectedService.id,
      cliente: formData.get('cliente') as string,
      telefono: formData.get('telefono') as string,
      email: formData.get('email') as string,
      imei: formData.get('imei') as string,
      customFields: formData.get('customFields') as string,
      precioVenta: formData.get('precioVenta') as string,
      precioCosto: selectedService.precio.toString(),
      notas: formData.get('notas') as string,
      tienda: user?.tienda || 'admin',
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800';
      case 'procesando': return 'bg-blue-100 text-blue-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'fallido': return 'bg-red-100 text-red-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servidor</h1>
          <p className="text-gray-600 mt-1">Gestión de servicios de desbloqueo y software</p>
        </div>
        
        {accountInfo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Saldo UnlockerFast</p>
            <p className="text-2xl font-bold text-blue-600">{accountInfo.credit}</p>
            <p className="text-xs text-gray-500">{accountInfo.mail}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('servicios')}
            className={`${
              activeTab === 'servicios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Servicios Disponibles
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`${
              activeTab === 'pedidos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Historial de Pedidos
          </button>
        </nav>
      </div>

      {/* Servicios Tab */}
      {activeTab === 'servicios' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleSyncServices}
              disabled={syncServicesMutation.isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {syncServicesMutation.isLoading ? 'Sincronizando...' : '🔄 Sincronizar Servicios'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services && (services as any[]).map((service: any) => (
              <div key={service.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{service.serviceName}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{service.serviceType}</span>
                </div>
                
                {service.groupName && (
                  <p className="text-sm text-gray-600 mb-2">{service.groupName}</p>
                )}
                
                {service.info && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.info}</p>
                )}
                
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Costo</p>
                    <p className="text-sm font-semibold text-gray-700">${service.precio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Venta</p>
                    <p className="text-sm font-semibold text-green-600">${service.precioVenta}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ganancia</p>
                    <p className="text-sm font-semibold text-blue-600">
                      ${(parseFloat(service.precioVenta) - parseFloat(service.precio)).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {service.tiempo && (
                  <p className="text-xs text-gray-500 mb-3">⏱️ {service.tiempo}</p>
                )}
                
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setShowNewOrderModal(true);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Crear Pedido
                </button>
              </div>
            ))}
          </div>

          {services && (services as any[]).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay servicios disponibles</p>
              <button
                onClick={handleSyncServices}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Sincronizar Servicios
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pedidos Tab */}
      {activeTab === 'pedidos' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders && (orders as any[]).map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{order.serviceName}</div>
                    {order.groupName && (
                      <div className="text-xs text-gray-500">{order.groupName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{order.cliente || '-'}</div>
                    {order.telefono && (
                      <div className="text-xs text-gray-500">{order.telefono}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.imei || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.precioVenta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${order.ganancia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(order.estado)}`}>
                      {order.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.fechaPedido).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders && (orders as any[]).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay pedidos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nuevo Pedido */}
      {showNewOrderModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nuevo Pedido - {selectedService.serviceName}</h2>
            
            <form onSubmit={handleCreateOrder}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    name="cliente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del cliente"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Teléfono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="email@ejemplo.com"
                  />
                </div>
                
                {selectedService.serviceType === 'IMEI' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI *</label>
                    <input
                      type="text"
                      name="imei"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="IMEI (15 dígitos)"
                      maxLength={15}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
                  <input
                    type="number"
                    name="precioVenta"
                    required
                    step="0.01"
                    defaultValue={selectedService.precioVenta}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>
                  <input
                    type="number"
                    value={selectedService.precio}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Campos Personalizados (JSON)</label>
                <textarea
                  name="customFields"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder='{"SERIAL_NUMBER": "ABC123"}'
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewOrderModal(false);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createOrderMutation.isLoading ? 'Creando...' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
