import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Building2, Store, PiggyBank, Briefcase, Shield, Wallet, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function DashboardGeneral() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Query para obtener todas las transacciones
  const { data: allTransactions = [], isLoading: loadingTransactions } = trpc.transactions.list.useQuery();
  
  // Query para obtener configuración
  const { data: configData = {} } = trpc.config.getAll.useQuery();

  const data = useMemo(() => {
    const config = {
      taxRate: parseFloat(configData.tax_rate || configData.taxRate || '8.25'),
      porcentajeAhorro: parseFloat(configData.savings_percentage || configData.porcentajeAhorro || '10'),
      porcentajeInversion: parseFloat(configData.investment_percentage || configData.porcentajeInversion || '10'),
      porcentajeEmergencia: parseFloat(configData.emergency_percentage || configData.porcentajeEmergencia || '5'),
      porcentajeDisponible: parseFloat(configData.available_percentage || configData.porcentajeDisponible || '75'),
    };

    // Filtrar transacciones de hoy
    const today = new Date().toISOString().split('T')[0];
    const transaccionesHoy = allTransactions.filter(t => {
      const fecha = new Date(t.fecha).toISOString().split('T')[0];
      return fecha === today;
    });

    // Separar por tienda
    const adminTransactions = transaccionesHoy.filter(t => t.tienda === 'admin');
    const sucursalTransactions = transaccionesHoy.filter(t => t.tienda === 'sucursal');

    // Calcular métricas para admin
    const adminIngresos = adminTransactions.filter(t => t.tipo === 'ingreso');
    const adminGastos = adminTransactions.filter(t => t.tipo === 'gasto');
    
    const adminEfectivo = adminIngresos
      .filter(i => i.metodo === 'efectivo')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const adminBanco = adminIngresos
      .filter(i => i.metodo === 'banco')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const adminTotalGastos = adminGastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const adminIngresoTotal = adminEfectivo + adminBanco;
    
    // Calcular taxes admin
    const adminTaxEfectivo = adminEfectivo * (config.taxRate / 100);
    const adminTaxBanco = adminBanco * (config.taxRate / 100);
    const adminTotalTax = adminTaxEfectivo + adminTaxBanco;
    
    // Ingreso neto admin después de taxes
    const adminNetoEfectivo = adminEfectivo - adminTaxEfectivo;
    const adminNetoBanco = adminBanco - adminTaxBanco;
    const adminIngresoNeto = adminNetoEfectivo + adminNetoBanco;
    const adminGananciaNeta = adminIngresoNeto - adminTotalGastos;

    // Calcular métricas para sucursal
    const sucursalIngresos = sucursalTransactions.filter(t => t.tipo === 'ingreso');
    const sucursalGastos = sucursalTransactions.filter(t => t.tipo === 'gasto');
    
    const sucursalEfectivo = sucursalIngresos
      .filter(i => i.metodo === 'efectivo')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const sucursalBanco = sucursalIngresos
      .filter(i => i.metodo === 'banco')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const sucursalTotalGastos = sucursalGastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    const sucursalIngresoTotal = sucursalEfectivo + sucursalBanco;
    
    // Calcular taxes sucursal
    const sucursalTaxEfectivo = sucursalEfectivo * (config.taxRate / 100);
    const sucursalTaxBanco = sucursalBanco * (config.taxRate / 100);
    const sucursalTotalTax = sucursalTaxEfectivo + sucursalTaxBanco;
    
    // Ingreso neto sucursal después de taxes
    const sucursalNetoEfectivo = sucursalEfectivo - sucursalTaxEfectivo;
    const sucursalNetoBanco = sucursalBanco - sucursalTaxBanco;
    const sucursalIngresoNeto = sucursalNetoEfectivo + sucursalNetoBanco;
    const sucursalGananciaNeta = sucursalIngresoNeto - sucursalTotalGastos;

    // Totales generales
    const totalEfectivo = adminEfectivo + sucursalEfectivo;
    const totalBanco = adminBanco + sucursalBanco;
    const totalIngresos = adminIngresoTotal + sucursalIngresoTotal;
    const totalGastos = adminTotalGastos + sucursalTotalGastos;
    const totalTax = adminTotalTax + sucursalTotalTax;
    const totalIngresoNeto = adminIngresoNeto + sucursalIngresoNeto;
    const totalGananciaNeta = adminGananciaNeta + sucursalGananciaNeta;
    const totalTransacciones = transaccionesHoy.length;

    // Distribución de fondos (sobre ingreso NETO después de taxes)
    const calcularDistribucion = (ingresoNeto: number) => ({
      ahorro: ingresoNeto * (config.porcentajeAhorro / 100),
      inversion: ingresoNeto * (config.porcentajeInversion / 100),
      emergencia: ingresoNeto * (config.porcentajeEmergencia / 100),
      disponible: ingresoNeto * (config.porcentajeDisponible / 100),
    });

    const distribucionAdmin = calcularDistribucion(adminIngresoNeto);
    const distribucionSucursal = calcularDistribucion(sucursalIngresoNeto);
    const distribucionTotal = calcularDistribucion(totalIngresoNeto);

    return {
      admin: {
        efectivo: adminEfectivo,
        banco: adminBanco,
        ingresoTotal: adminIngresoTotal,
        ingresoNeto: adminIngresoNeto,
        gastos: adminTotalGastos,
        tax: adminTotalTax,
        gananciaNeta: adminGananciaNeta,
        transacciones: adminTransactions.length,
        distribucion: distribucionAdmin,
      },
      sucursal: {
        efectivo: sucursalEfectivo,
        banco: sucursalBanco,
        ingresoTotal: sucursalIngresoTotal,
        ingresoNeto: sucursalIngresoNeto,
        gastos: sucursalTotalGastos,
        tax: sucursalTotalTax,
        gananciaNeta: sucursalGananciaNeta,
        transacciones: sucursalTransactions.length,
        distribucion: distribucionSucursal,
      },
      total: {
        efectivo: totalEfectivo,
        banco: totalBanco,
        ingresos: totalIngresos,
        ingresoNeto: totalIngresoNeto,
        gastos: totalGastos,
        tax: totalTax,
        gananciaNeta: totalGananciaNeta,
        transacciones: totalTransacciones,
        distribucion: distribucionTotal,
      },
      config,
    };
  }, [allTransactions, configData]);

  // Datos para gráfica de barras comparativa
  const chartData = [
    { name: 'Ingresos', principal: data.admin.ingresoTotal, sucursal: data.sucursal.ingresoTotal },
    { name: 'Taxes', principal: data.admin.tax, sucursal: data.sucursal.tax },
    { name: 'Gastos', principal: data.admin.gastos, sucursal: data.sucursal.gastos },
    { name: 'Ganancia', principal: data.admin.gananciaNeta, sucursal: data.sucursal.gananciaNeta },
  ];

  // Datos para gráfica de pie
  const pieData = [
    { name: 'Ahorro', value: data.total.distribucion.ahorro },
    { name: 'Inversión', value: data.total.distribucion.inversion },
    { name: 'Emergencia', value: data.total.distribucion.emergencia },
    { name: 'Disponible', value: data.total.distribucion.disponible },
  ];

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              Solo el administrador puede ver el Dashboard General.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loadingTransactions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard General</h1>
          <p className="text-muted-foreground">Vista consolidada de ambas tiendas - Datos del día</p>
        </div>

        {/* Resumen Total */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Ingresos Totales</p>
                <p className="text-2xl font-bold text-blue-800">${data.total.ingresos.toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-1">Neto: ${data.total.ingresoNeto.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Taxes Totales</p>
                <p className="text-2xl font-bold text-orange-800">${data.total.tax.toFixed(2)}</p>
                <p className="text-xs text-orange-600 mt-1">Tasa: {data.config.taxRate}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-800">${data.total.gastos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Ganancia Neta</p>
                <p className="text-2xl font-bold text-green-800">${data.total.gananciaNeta.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">{data.total.transacciones} transacciones</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Desglose por Tienda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fixopolis Solutions Principal */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Fixopolis Solutions</h2>
                <p className="text-sm text-muted-foreground">Tienda Principal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-xl font-bold text-green-600">${data.admin.efectivo.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Banco</p>
                <p className="text-xl font-bold text-blue-600">${data.admin.banco.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Taxes</p>
                <p className="text-xl font-bold text-orange-600">${data.admin.tax.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-red-600">${data.admin.gastos.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-muted-foreground">Ganancia Neta</p>
                <p className="text-2xl font-bold text-emerald-600">${data.admin.gananciaNeta.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Distribución de Fondos (Neto: ${data.admin.ingresoNeto.toFixed(2)})</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-blue-500" /> Ahorro ({data.config.porcentajeAhorro}%)</span>
                  <span className="font-semibold">${data.admin.distribucion.ahorro.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-500" /> Inversión ({data.config.porcentajeInversion}%)</span>
                  <span className="font-semibold">${data.admin.distribucion.inversion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-500" /> Emergencia ({data.config.porcentajeEmergencia}%)</span>
                  <span className="font-semibold">${data.admin.distribucion.emergencia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" /> Disponible ({data.config.porcentajeDisponible}%)</span>
                  <span className="font-semibold">${data.admin.distribucion.disponible.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Fixopolis Solutions Sucursal */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Fixopolis Solutions Sucursal</h2>
                <p className="text-sm text-muted-foreground">Sucursal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-xl font-bold text-green-600">${data.sucursal.efectivo.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Banco</p>
                <p className="text-xl font-bold text-blue-600">${data.sucursal.banco.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Taxes</p>
                <p className="text-xl font-bold text-orange-600">${data.sucursal.tax.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-red-600">${data.sucursal.gastos.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-muted-foreground">Ganancia Neta</p>
                <p className="text-2xl font-bold text-emerald-600">${data.sucursal.gananciaNeta.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Distribución de Fondos (Neto: ${data.sucursal.ingresoNeto.toFixed(2)})</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-blue-500" /> Ahorro ({data.config.porcentajeAhorro}%)</span>
                  <span className="font-semibold">${data.sucursal.distribucion.ahorro.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-500" /> Inversión ({data.config.porcentajeInversion}%)</span>
                  <span className="font-semibold">${data.sucursal.distribucion.inversion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-500" /> Emergencia ({data.config.porcentajeEmergencia}%)</span>
                  <span className="font-semibold">${data.sucursal.distribucion.emergencia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" /> Disponible ({data.config.porcentajeDisponible}%)</span>
                  <span className="font-semibold">${data.sucursal.distribucion.disponible.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comparativa por Tienda</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="principal" fill="#3b82f6" name="Principal" />
                  <Bar dataKey="sucursal" fill="#8b5cf6" name="Sucursal" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución Total de Fondos</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
