import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Store, Smartphone, Package, Wrench, DollarSign, TrendingUp } from 'lucide-react';

export default function InversionCapitalSucursal() {
  const { user } = useAuth();

  // Solo admin puede ver esta página
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-500">No tienes permisos para ver esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  // Queries para obtener inventario de sucursal
  const { data: phonesSucursal = [] } = trpc.inventoryPhones.listByTienda.useQuery({ tienda: 'sucursal' });
  const { data: accessoriesSucursal = [] } = trpc.inventoryAccessories.listByTienda.useQuery({ tienda: 'sucursal', activo: 1 });
  const { data: partsSucursal = [] } = trpc.inventoryParts.listByTienda.useQuery({ tienda: 'sucursal', activo: 1 });

  // Calcular totales
  const totalInversionTelefonos = phonesSucursal
    .filter((p: any) => p.estado === 'disponible')
    .reduce((sum: number, p: any) => sum + parseFloat(p.precioCompra || '0'), 0);

  const totalInversionAccesorios = accessoriesSucursal
    .reduce((sum: number, a: any) => sum + (parseFloat(a.precioCompraUnitario || '0') * (a.cantidadActual || 0)), 0);

  const totalInversionPartes = partsSucursal
    .reduce((sum: number, p: any) => sum + (parseFloat(p.precioCompraUnitario || '0') * (p.cantidadActual || 0)), 0);

  const inversionTotal = totalInversionTelefonos + totalInversionAccesorios + totalInversionPartes;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Store className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inversión Capital Sucursal</h1>
            <p className="text-gray-600">Monitoreo de inventario e inversión en sucursal</p>
          </div>
        </div>

        {/* Resumen General */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Resumen de Inversión</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Inversión Total</p>
              <p className="text-2xl font-bold text-purple-600">${inversionTotal.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Teléfonos</p>
              <p className="text-2xl font-bold text-blue-600">${totalInversionTelefonos.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{phonesSucursal.filter((p: any) => p.estado === 'disponible').length} en stock</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Accesorios</p>
              <p className="text-2xl font-bold text-green-600">${totalInversionAccesorios.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{accessoriesSucursal.reduce((sum: number, a: any) => sum + (a.cantidadActual || 0), 0)} unidades</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Partes</p>
              <p className="text-2xl font-bold text-orange-600">${totalInversionPartes.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{partsSucursal.reduce((sum: number, p: any) => sum + (p.cantidadActual || 0), 0)} unidades</p>
            </div>
          </div>
        </Card>

        {/* Teléfonos */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Teléfonos en Sucursal</h2>
          </div>
          {phonesSucursal.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay teléfonos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Código</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Modelo</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Precio Compra</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Precio Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {phonesSucursal.map((phone: any) => (
                    <tr key={phone.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{phone.codigo}</td>
                      <td className="px-4 py-2 text-sm">{phone.marca} {phone.modelo}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          phone.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                          phone.estado === 'vendido' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {phone.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(phone.precioCompra || '0').toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(phone.precioVenta || '0').toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Accesorios */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Accesorios en Sucursal</h2>
          </div>
          {accessoriesSucursal.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay accesorios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Código</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Nombre</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Stock</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Precio Compra</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Inversión</th>
                  </tr>
                </thead>
                <tbody>
                  {accessoriesSucursal.map((acc: any) => (
                    <tr key={acc.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{acc.codigo}</td>
                      <td className="px-4 py-2 text-sm">{acc.nombre}</td>
                      <td className="px-4 py-2 text-sm text-right">{acc.cantidadActual}</td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(acc.precioCompraUnitario || '0').toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        ${(parseFloat(acc.precioCompraUnitario || '0') * (acc.cantidadActual || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Partes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Partes en Sucursal</h2>
          </div>
          {partsSucursal.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay partes registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Código</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Nombre</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Stock</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Precio Compra</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Inversión</th>
                  </tr>
                </thead>
                <tbody>
                  {partsSucursal.map((part: any) => (
                    <tr key={part.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{part.codigo}</td>
                      <td className="px-4 py-2 text-sm">{part.nombre}</td>
                      <td className="px-4 py-2 text-sm text-right">{part.cantidadActual}</td>
                      <td className="px-4 py-2 text-sm text-right">${parseFloat(part.precioCompraUnitario || '0').toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        ${(parseFloat(part.precioCompraUnitario || '0') * (part.cantidadActual || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
