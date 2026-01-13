import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/utils/storage';
import { BarChart3, TrendingUp, DollarSign, Building2, Store, PiggyBank, Briefcase, Shield, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function DashboardGeneral() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const data = useMemo(() => {
    const adminData = storage.getDailyData('admin');
    const sucursalData = storage.getDailyData('sucursal');
    const config = storage.getConfig();

    // Calcular métricas para tienda principal
    const adminEfectivo = adminData.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const adminBanco = adminData.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    const adminGastos = adminData.gastos.reduce((sum, t) => sum + t.monto, 0);
    const adminNomina = adminData.nomina?.reduce((sum, t) => sum + t.monto, 0) || 0;
    const adminIngresoTotal = adminEfectivo + adminBanco;
    const adminGananciaNeta = adminIngresoTotal - adminGastos - adminNomina;

    // Calcular métricas para sucursal
    const sucursalEfectivo = sucursalData.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const sucursalBanco = sucursalData.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    const sucursalGastos = sucursalData.gastos.reduce((sum, t) => sum + t.monto, 0);
    const sucursalNomina = sucursalData.nomina?.reduce((sum, t) => sum + t.monto, 0) || 0;
    const sucursalIngresoTotal = sucursalEfectivo + sucursalBanco;
    const sucursalGananciaNeta = sucursalIngresoTotal - sucursalGastos - sucursalNomina;

    // Totales generales
    const totalEfectivo = adminEfectivo + sucursalEfectivo;
    const totalBanco = adminBanco + sucursalBanco;
    const totalIngresos = adminIngresoTotal + sucursalIngresoTotal;
    const totalGastos = adminGastos + sucursalGastos;
    const totalNomina = adminNomina + sucursalNomina;
    const totalGananciaNeta = adminGananciaNeta + sucursalGananciaNeta;
    const totalTransacciones = adminData.ingresos.length + adminData.gastos.length + 
                               sucursalData.ingresos.length + sucursalData.gastos.length;

    // Distribución de fondos (sobre ingreso total)
    const calcularDistribucion = (ingreso: number) => ({
      ahorro: ingreso * (config.porcentajeAhorro / 100),
      inversion: ingreso * (config.porcentajeInversion / 100),
      emergencia: ingreso * (config.porcentajeEmergencia / 100),
      disponible: ingreso * (config.porcentajeDisponible / 100),
    });

    const distribucionAdmin = calcularDistribucion(adminIngresoTotal);
    const distribucionSucursal = calcularDistribucion(sucursalIngresoTotal);
    const distribucionTotal = calcularDistribucion(totalIngresos);

    return {
      admin: {
        efectivo: adminEfectivo,
        banco: adminBanco,
        ingresoTotal: adminIngresoTotal,
        gastos: adminGastos,
        nomina: adminNomina,
        gananciaNeta: adminGananciaNeta,
        transacciones: adminData.ingresos.length + adminData.gastos.length,
        distribucion: distribucionAdmin,
      },
      sucursal: {
        efectivo: sucursalEfectivo,
        banco: sucursalBanco,
        ingresoTotal: sucursalIngresoTotal,
        gastos: sucursalGastos,
        nomina: sucursalNomina,
        gananciaNeta: sucursalGananciaNeta,
        transacciones: sucursalData.ingresos.length + sucursalData.gastos.length,
        distribucion: distribucionSucursal,
      },
      total: {
        efectivo: totalEfectivo,
        banco: totalBanco,
        ingresos: totalIngresos,
        gastos: totalGastos,
        nomina: totalNomina,
        gananciaNeta: totalGananciaNeta,
        transacciones: totalTransacciones,
        distribucion: distribucionTotal,
      },
      config,
    };
  }, []);

  // Datos para gráfica de barras comparativa
  const chartData = [
    { name: 'Ingresos', principal: data.admin.ingresoTotal, sucursal: data.sucursal.ingresoTotal },
    { name: 'Gastos', principal: data.admin.gastos, sucursal: data.sucursal.gastos },
    { name: 'Nómina', principal: data.admin.nomina, sucursal: data.sucursal.nomina },
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard General</h1>
          <p className="text-muted-foreground">Vista consolidada de ambas tiendas - Reset semanal</p>
        </div>

        {/* Resumen Total */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Ingresos Totales</p>
                <p className="text-2xl font-bold text-blue-800">${data.total.ingresos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-800">${data.total.gastos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Ganancia Neta</p>
                <p className="text-2xl font-bold text-green-800">${data.total.gananciaNeta.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Transacciones</p>
                <p className="text-2xl font-bold text-purple-800">{data.total.transacciones}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Desglose por Tienda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1+PhoneFix Principal */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">1+PhoneFix</h2>
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
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-red-600">${data.admin.gastos.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Ganancia Neta</p>
                <p className="text-xl font-bold text-emerald-600">${data.admin.gananciaNeta.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Distribución de Fondos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-blue-500" /> Ahorro</span>
                  <span className="font-semibold">${data.admin.distribucion.ahorro.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-500" /> Inversión</span>
                  <span className="font-semibold">${data.admin.distribucion.inversion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-500" /> Emergencia</span>
                  <span className="font-semibold">${data.admin.distribucion.emergencia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" /> Disponible</span>
                  <span className="font-semibold">${data.admin.distribucion.disponible.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 1+PhoneFix Downtown */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">1+PhoneFix Downtown</h2>
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
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-xl font-bold text-red-600">${data.sucursal.gastos.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Ganancia Neta</p>
                <p className="text-xl font-bold text-emerald-600">${data.sucursal.gananciaNeta.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Distribución de Fondos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-blue-500" /> Ahorro</span>
                  <span className="font-semibold">${data.sucursal.distribucion.ahorro.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-500" /> Inversión</span>
                  <span className="font-semibold">${data.sucursal.distribucion.inversion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-500" /> Emergencia</span>
                  <span className="font-semibold">${data.sucursal.distribucion.emergencia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" /> Disponible</span>
                  <span className="font-semibold">${data.sucursal.distribucion.disponible.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Comparación por Tienda</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="principal" name="1+PhoneFix" fill="#3b82f6" />
                <Bar dataKey="sucursal" name="Downtown" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Distribución Total de Fondos</h3>
            <ResponsiveContainer width="100%" height={300}>
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
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
