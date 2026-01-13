import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/utils/storage';
import { Receipt, DollarSign, Landmark, Building2, Store, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function Taxes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const data = useMemo(() => {
    const config = storage.getConfig();
    const taxRate = config.taxRate || 8.25;
    
    // Datos diarios
    const adminDaily = storage.getDailyData('admin');
    const sucursalDaily = storage.getDailyData('sucursal');
    
    // Datos semanales
    const adminWeekly = storage.getWeeklyData('admin');
    const sucursalWeekly = storage.getWeeklyData('sucursal');
    
    // Calcular taxes diarios
    const adminDailyEfectivo = adminDaily.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const adminDailyBanco = adminDaily.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    const sucursalDailyEfectivo = sucursalDaily.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const sucursalDailyBanco = sucursalDaily.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    
    // Calcular taxes semanales
    const adminWeeklyEfectivo = adminWeekly.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const adminWeeklyBanco = adminWeekly.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    const sucursalWeeklyEfectivo = sucursalWeekly.ingresos.filter(t => t.metodo === 'efectivo').reduce((sum, t) => sum + t.monto, 0);
    const sucursalWeeklyBanco = sucursalWeekly.ingresos.filter(t => t.metodo === 'banco').reduce((sum, t) => sum + t.monto, 0);
    
    return {
      taxRate,
      daily: {
        admin: {
          efectivo: adminDailyEfectivo,
          banco: adminDailyBanco,
          taxEfectivo: adminDailyEfectivo * (taxRate / 100),
          taxBanco: adminDailyBanco * (taxRate / 100),
        },
        sucursal: {
          efectivo: sucursalDailyEfectivo,
          banco: sucursalDailyBanco,
          taxEfectivo: sucursalDailyEfectivo * (taxRate / 100),
          taxBanco: sucursalDailyBanco * (taxRate / 100),
        },
        total: {
          efectivo: adminDailyEfectivo + sucursalDailyEfectivo,
          banco: adminDailyBanco + sucursalDailyBanco,
          taxEfectivo: (adminDailyEfectivo + sucursalDailyEfectivo) * (taxRate / 100),
          taxBanco: (adminDailyBanco + sucursalDailyBanco) * (taxRate / 100),
        },
      },
      weekly: {
        admin: {
          efectivo: adminWeeklyEfectivo,
          banco: adminWeeklyBanco,
          taxEfectivo: adminWeeklyEfectivo * (taxRate / 100),
          taxBanco: adminWeeklyBanco * (taxRate / 100),
        },
        sucursal: {
          efectivo: sucursalWeeklyEfectivo,
          banco: sucursalWeeklyBanco,
          taxEfectivo: sucursalWeeklyEfectivo * (taxRate / 100),
          taxBanco: sucursalWeeklyBanco * (taxRate / 100),
        },
        total: {
          efectivo: adminWeeklyEfectivo + sucursalWeeklyEfectivo,
          banco: adminWeeklyBanco + sucursalWeeklyBanco,
          taxEfectivo: (adminWeeklyEfectivo + sucursalWeeklyEfectivo) * (taxRate / 100),
          taxBanco: (adminWeeklyBanco + sucursalWeeklyBanco) * (taxRate / 100),
        },
      },
    };
  }, []);

  // Datos para gráficas
  const dailyChartData = [
    {
      name: '1+PhoneFix',
      'Tax Efectivo': data.daily.admin.taxEfectivo,
      'Tax Banco': data.daily.admin.taxBanco,
    },
    {
      name: 'Downtown',
      'Tax Efectivo': data.daily.sucursal.taxEfectivo,
      'Tax Banco': data.daily.sucursal.taxBanco,
    },
  ];

  const weeklyChartData = [
    {
      name: '1+PhoneFix',
      'Tax Efectivo': data.weekly.admin.taxEfectivo,
      'Tax Banco': data.weekly.admin.taxBanco,
    },
    {
      name: 'Downtown',
      'Tax Efectivo': data.weekly.sucursal.taxEfectivo,
      'Tax Banco': data.weekly.sucursal.taxBanco,
    },
  ];

  const pieData = [
    { name: 'Tax Efectivo Diario', value: data.daily.total.taxEfectivo },
    { name: 'Tax Banco Diario', value: data.daily.total.taxBanco },
  ];

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              Solo el administrador puede ver el panel de taxes.
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
          <h1 className="text-3xl font-bold mb-2">Panel de Taxes</h1>
          <p className="text-muted-foreground">Impuestos del {data.taxRate}% sobre ingresos brutos</p>
        </div>

        {/* Resumen Diario */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Taxes del Día</h2>
              <p className="text-sm text-muted-foreground">Impuestos acumulados hoy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1+PhoneFix */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">1+PhoneFix</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" /> Efectivo
                  </span>
                  <span className="font-semibold text-amber-600">${data.daily.admin.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Landmark className="w-4 h-4 text-blue-500" /> Banco
                  </span>
                  <span className="font-semibold text-amber-600">${data.daily.admin.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-amber-700">${(data.daily.admin.taxEfectivo + data.daily.admin.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Downtown */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Downtown</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" /> Efectivo
                  </span>
                  <span className="font-semibold text-amber-600">${data.daily.sucursal.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Landmark className="w-4 h-4 text-blue-500" /> Banco
                  </span>
                  <span className="font-semibold text-amber-600">${data.daily.sucursal.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-amber-700">${(data.daily.sucursal.taxEfectivo + data.daily.sucursal.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total General */}
            <div className="p-4 bg-amber-100 rounded-xl border-2 border-amber-300 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-amber-800">Total General</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-amber-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Efectivo
                  </span>
                  <span className="font-bold text-amber-800">${data.daily.total.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-amber-700 flex items-center gap-1">
                    <Landmark className="w-4 h-4" /> Banco
                  </span>
                  <span className="font-bold text-amber-800">${data.daily.total.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-300 pt-2">
                  <span className="font-bold text-amber-800">TOTAL</span>
                  <span className="text-2xl font-bold text-amber-900">${(data.daily.total.taxEfectivo + data.daily.total.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Resumen Semanal */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Taxes de la Semana</h2>
              <p className="text-sm text-muted-foreground">Impuestos acumulados esta semana</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1+PhoneFix */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">1+PhoneFix</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Efectivo</span>
                  <span className="font-semibold text-blue-600">${data.weekly.admin.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Banco</span>
                  <span className="font-semibold text-blue-600">${data.weekly.admin.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-blue-700">${(data.weekly.admin.taxEfectivo + data.weekly.admin.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Downtown */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Downtown</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Efectivo</span>
                  <span className="font-semibold text-blue-600">${data.weekly.sucursal.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Banco</span>
                  <span className="font-semibold text-blue-600">${data.weekly.sucursal.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-blue-700">${(data.weekly.sucursal.taxEfectivo + data.weekly.sucursal.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total General */}
            <div className="p-4 bg-blue-100 rounded-xl border-2 border-blue-300 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-blue-800">Total Semanal</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Efectivo</span>
                  <span className="font-bold text-blue-800">${data.weekly.total.taxEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Banco</span>
                  <span className="font-bold text-blue-800">${data.weekly.total.taxBanco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2">
                  <span className="font-bold text-blue-800">TOTAL</span>
                  <span className="text-2xl font-bold text-blue-900">${(data.weekly.total.taxEfectivo + data.weekly.total.taxBanco).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Comparativa Diaria por Tienda</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="Tax Efectivo" fill="#22c55e" />
                  <Bar dataKey="Tax Banco" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Distribución de Taxes del Día</h3>
            <div className="h-[300px]">
              {(data.daily.total.taxEfectivo + data.daily.total.taxBanco) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.replace('Tax ', '')} ${(percent * 100).toFixed(0)}%`}
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
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay taxes registrados hoy
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Comparativa Semanal */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Comparativa Semanal por Tienda</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Tax Efectivo" fill="#f59e0b" />
                <Bar dataKey="Tax Banco" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
