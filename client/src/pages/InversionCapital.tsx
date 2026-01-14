import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { 
  Wallet, Smartphone, Headphones, Wrench, 
  TrendingUp, TrendingDown, DollarSign, Package,
  ArrowRight, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'wouter';

export default function InversionCapital() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Queries para obtener datos
  const { data: phones = [] } = trpc.inventoryPhones.list.useQuery({ tienda: user?.tienda });
  const { data: accessories = [] } = trpc.inventoryAccessories.list.useQuery({ tienda: user?.tienda, activo: 1 });
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ tienda: user?.tienda, activo: 1 });

  // Calcular totales
  const totales = useMemo(() => {
    // Teléfonos
    const phonesDisponibles = phones.filter(p => p.estado === 'disponible');
    const phonesVendidos = phones.filter(p => p.estado === 'vendido');
    
    const inversionTelefonosDisponible = phonesDisponibles.reduce((sum, p) => sum + Number(p.precioCompra), 0);
    const inversionTelefonosVendidos = phonesVendidos.reduce((sum, p) => sum + Number(p.precioCompra), 0);
    const ventaTelefonos = phonesVendidos.reduce((sum, p) => sum + Number(p.precioVenta || 0), 0);
    const gananciaTelefonos = ventaTelefonos - inversionTelefonosVendidos;

    // Accesorios
    const inversionAccesoriosDisponible = accessories.reduce((sum, a) => {
      return sum + (Number(a.precioCompraUnitario) * Number(a.cantidadActual));
    }, 0);
    const inversionAccesoriosVendidos = accessories.reduce((sum, a) => {
      return sum + (Number(a.precioCompraUnitario) * Number(a.cantidadVendida));
    }, 0);
    const ventaAccesorios = accessories.reduce((sum, a) => {
      return sum + (Number(a.precioVentaUnitario) * Number(a.cantidadVendida));
    }, 0);
    const gananciaAccesorios = ventaAccesorios - inversionAccesoriosVendidos;

    // Partes
    const inversionPartesDisponible = parts.reduce((sum, p) => {
      return sum + (Number(p.precioCompraUnitario) * Number(p.cantidadActual));
    }, 0);
    const inversionPartesUsadas = parts.reduce((sum, p) => {
      return sum + (Number(p.precioCompraUnitario) * Number(p.cantidadUsada));
    }, 0);

    // Totales
    const stockSinLiquidar = inversionTelefonosDisponible + inversionAccesoriosDisponible + inversionPartesDisponible;
    const stockLiquidado = inversionTelefonosVendidos + inversionAccesoriosVendidos + inversionPartesUsadas;
    const gananciaTotal = gananciaTelefonos + gananciaAccesorios;
    const inversionTotal = stockSinLiquidar + stockLiquidado;

    return {
      // Teléfonos
      phonesDisponibles: phonesDisponibles.length,
      inversionTelefonosDisponible,
      inversionTelefonosVendidos,
      gananciaTelefonos,
      
      // Accesorios
      accesoriosDisponibles: accessories.reduce((sum, a) => sum + Number(a.cantidadActual), 0),
      accesoriosProductos: accessories.length,
      inversionAccesoriosDisponible,
      inversionAccesoriosVendidos,
      gananciaAccesorios,
      
      // Partes
      partesDisponibles: parts.reduce((sum, p) => sum + Number(p.cantidadActual), 0),
      partesTipos: parts.length,
      inversionPartesDisponible,
      inversionPartesUsadas,
      
      // Totales
      stockSinLiquidar,
      stockLiquidado,
      gananciaTotal,
      inversionTotal,
      porcentajeLiquidado: inversionTotal > 0 ? (stockLiquidado / inversionTotal * 100) : 0,
    };
  }, [phones, accessories, parts]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">💼 Inversión de Capital</h1>
          <p className="text-muted-foreground">
            Control de inventario y tracking de inversión liquidada vs sin liquidar
          </p>
        </div>

        {/* Resumen General */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Resumen General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Inversión Total Histórica</p>
              <p className="text-2xl font-bold text-blue-700">${totales.inversionTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Sin Liquidar</p>
              <p className="text-2xl font-bold text-orange-600">${totales.stockSinLiquidar.toFixed(2)}</p>
              <p className="text-xs text-orange-600">{(100 - totales.porcentajeLiquidado).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Liquidado</p>
              <p className="text-2xl font-bold text-green-600">${totales.stockLiquidado.toFixed(2)}</p>
              <p className="text-xs text-green-600">{totales.porcentajeLiquidado.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ganancia Acumulada</p>
              <p className="text-2xl font-bold text-emerald-700">${totales.gananciaTotal.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Teléfonos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              📱 Teléfonos
            </h2>
            <Button onClick={() => navigate('/inventario/telefonos')}>
              Ver Detalle <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-600">Sin Liquidar</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">${totales.inversionTelefonosDisponible.toFixed(2)}</p>
              <p className="text-xs text-orange-600 mt-1">{totales.phonesDisponibles} teléfonos en stock</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-600">Liquidado Total</p>
              </div>
              <p className="text-2xl font-bold text-green-700">${totales.inversionTelefonosVendidos.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Inversión recuperada</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-600">Ganancia</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">${totales.gananciaTelefonos.toFixed(2)}</p>
              <p className="text-xs text-emerald-600 mt-1">Ganancia neta</p>
            </div>
          </div>
        </Card>

        {/* Accesorios */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-purple-600" />
              🔌 Accesorios
            </h2>
            <Button onClick={() => navigate('/inventario/accesorios')}>
              Ver Detalle <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-600">Sin Liquidar</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">${totales.inversionAccesoriosDisponible.toFixed(2)}</p>
              <p className="text-xs text-orange-600 mt-1">{totales.accesoriosDisponibles} items en stock</p>
              <p className="text-xs text-orange-600">{totales.accesoriosProductos} productos diferentes</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-600">Liquidado Total</p>
              </div>
              <p className="text-2xl font-bold text-green-700">${totales.inversionAccesoriosVendidos.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Inversión recuperada</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-600">Ganancia</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">${totales.gananciaAccesorios.toFixed(2)}</p>
              <p className="text-xs text-emerald-600 mt-1">Ganancia neta</p>
            </div>
          </div>
        </Card>

        {/* Partes para Reparación */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-gray-600" />
              🔧 Partes para Reparación
            </h2>
            <Button onClick={() => navigate('/inventario/partes')}>
              Ver Detalle <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-600">Sin Liquidar</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">${totales.inversionPartesDisponible.toFixed(2)}</p>
              <p className="text-xs text-orange-600 mt-1">{totales.partesDisponibles} items en stock</p>
              <p className="text-xs text-orange-600">{totales.partesTipos} tipos de partes</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Usado en Reparaciones</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">${totales.inversionPartesUsadas.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">Inversión usada</p>
            </div>
          </div>
        </Card>

        {/* Alertas de Stock Bajo */}
        {(accessories.some(a => Number(a.cantidadActual) <= Number(a.stockMinimo)) || 
          parts.some(p => Number(p.cantidadActual) <= Number(p.stockMinimo))) && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-semibold text-yellow-700">⚠️ Alertas de Stock Bajo</h2>
            </div>
            <div className="space-y-2">
              {accessories
                .filter(a => Number(a.cantidadActual) <= Number(a.stockMinimo))
                .map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white rounded border border-yellow-200">
                    <div>
                      <p className="font-medium">{a.nombre}</p>
                      <p className="text-sm text-gray-600">Accesorio - Stock: {a.cantidadActual} (Mínimo: {a.stockMinimo})</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/inventario/accesorios')}>
                      Ver
                    </Button>
                  </div>
                ))}
              {parts
                .filter(p => Number(p.cantidadActual) <= Number(p.stockMinimo))
                .map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded border border-yellow-200">
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-sm text-gray-600">Parte - Stock: {p.cantidadActual} (Mínimo: {p.stockMinimo})</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/inventario/partes')}>
                      Ver
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
