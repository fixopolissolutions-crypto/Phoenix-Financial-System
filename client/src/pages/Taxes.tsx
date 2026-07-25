import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/utils/storage';
import { Receipt, DollarSign, Landmark, Building2, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function Taxes() {
  const { user } = useAuth();

  const data = useMemo(() => {
    const config = storage.getConfig();
    const taxRate = config.taxRate || 8.25;

    // Datos diarios
    const adminDaily = storage.getDailyData('admin');
    // Datos semanales
    const adminWeekly = storage.getWeeklyData('admin');

    // Calcular taxes diarios
    const dailyEfectivo = adminDaily.ingresos.filter((t: any) => t.metodo === 'efectivo').reduce((sum: number, t: any) => sum + t.monto, 0);
    const dailyBanco = adminDaily.ingresos.filter((t: any) => t.metodo === 'banco').reduce((sum: number, t: any) => sum + t.monto, 0);

    // Calcular taxes semanales
    const weeklyEfectivo = adminWeekly.ingresos.filter((t: any) => t.metodo === 'efectivo').reduce((sum: number, t: any) => sum + t.monto, 0);
    const weeklyBanco = adminWeekly.ingresos.filter((t: any) => t.metodo === 'banco').reduce((sum: number, t: any) => sum + t.monto, 0);

    return {
      taxRate,
      daily: {
        efectivo: dailyEfectivo,
        banco: dailyBanco,
        taxEfectivo: dailyEfectivo * (taxRate / 100),
        taxBanco: dailyBanco * (taxRate / 100),
        total: (dailyEfectivo + dailyBanco) * (taxRate / 100),
      },
      weekly: {
        efectivo: weeklyEfectivo,
        banco: weeklyBanco,
        taxEfectivo: weeklyEfectivo * (taxRate / 100),
        taxBanco: weeklyBanco * (taxRate / 100),
        total: (weeklyEfectivo + weeklyBanco) * (taxRate / 100),
      },
    };
  }, []);

  const dailyChartData = [
    { name: 'Efectivo', Tax: data.daily.taxEfectivo },
    { name: 'Banco', Tax: data.daily.taxBanco },
  ];

  const weeklyChartData = [
    { name: 'Efectivo', Tax: data.weekly.taxEfectivo },
    { name: 'Banco', Tax: data.weekly.taxBanco },
  ];

  const pieData = [
    { name: 'Tax Efectivo', value: data.daily.taxEfectivo },
    { name: 'Tax Banco', value: data.daily.taxBanco },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Taxes</h1>
          <p className="text-muted-foreground">Impuestos del {data.taxRate}% sobre ingresos brutos — Fixopolis Solutions</p>
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
            {/* Efectivo */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Efectivo</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium">${data.daily.efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tax ({data.taxRate}%)</span>
                  <span className="font-bold text-amber-600">${data.daily.taxEfectivo.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Banco */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Banco</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium">${data.daily.banco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tax ({data.taxRate}%)</span>
                  <span className="font-bold text-amber-600">${data.daily.taxBanco.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total General */}
            <div className="p-4 bg-amber-100 rounded-xl border-2 border-amber-300 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-amber-800">Total del Día</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-amber-700">Ingresos Totales</span>
                  <span className="font-bold text-amber-800">${(data.daily.efectivo + data.daily.banco).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-300 pt-2">
                  <span className="font-bold text-amber-800">TAX TOTAL</span>
                  <span className="text-2xl font-bold text-amber-900">${data.daily.total.toFixed(2)}</span>
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
            {/* Efectivo */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Efectivo</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium">${data.weekly.efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tax ({data.taxRate}%)</span>
                  <span className="font-bold text-blue-600">${data.weekly.taxEfectivo.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Banco */}
            <div className="p-4 bg-white rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Banco</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium">${data.weekly.banco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tax ({data.taxRate}%)</span>
                  <span className="font-bold text-blue-600">${data.weekly.taxBanco.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total Semanal */}
            <div className="p-4 bg-blue-100 rounded-xl border-2 border-blue-300 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-blue-800">Total Semanal</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Ingresos Totales</span>
                  <span className="font-bold text-blue-800">${(data.weekly.efectivo + data.weekly.banco).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2">
                  <span className="font-bold text-blue-800">TAX TOTAL</span>
                  <span className="text-2xl font-bold text-blue-900">${data.weekly.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Taxes del Día por Método</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="Tax" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Distribución de Taxes del Día</h3>
            <div className="h-[300px]">
              {data.daily.total > 0 ? (
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
          <h3 className="font-semibold text-lg mb-4">Taxes de la Semana por Método</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Tax" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
