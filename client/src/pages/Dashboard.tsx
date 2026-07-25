import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Activity, Receipt, Landmark, Loader2, Wallet } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

export default function Dashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const utils = trpc.useContext();
  
  // Query para obtener todas las transacciones
  const { data: transacciones = [], isLoading: loadingTransactions } = trpc.transactions.list.useQuery({
    tienda: 'admin',
  });

  // Query para gráfica mensual — últimos 6 meses
  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }, []);

  const { data: transaccionesMensuales = [] } = trpc.transactions.list.useQuery({
    tienda: 'admin',
    fechaInicio: sixMonthsAgo,
  });

  // Query para reparaciones mensuales
  const { data: reparaciones = [] } = trpc.repairs.list.useQuery();

  // Query para obtener configuración
  const { data: configData = {} } = trpc.config.getAll.useQuery();

  // Detectar cambio de día y actualizar automáticamente
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDate) {
        console.log('Nuevo día detectado:', newDate);
        setCurrentDate(newDate);
        // Invalidar queries para recargar datos
        utils.transactions.list.invalidate();
        utils.config.getAll.invalidate();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(checkMidnight);
  }, [currentDate, utils]);

  const data = useMemo(() => {
    if (!user) return null;
    
    const config = {
      taxRate: parseFloat(configData.taxRate || '8.25'),
      porcentajeAhorro: parseFloat(configData.porcentajeAhorro || '30'),
      porcentajeInversion: parseFloat(configData.porcentajeInversion || '20'),
      porcentajeEmergencia: parseFloat(configData.porcentajeEmergencia || '10'),
      porcentajeDisponible: parseFloat(configData.porcentajeDisponible || '40'),
      cajaChicaAdmin: parseFloat(configData.cajaChicaAdmin || '500'),
      cajaChicaSucursal: parseFloat(configData.cajaChicaSucursal || '300'),
    };

    // Filtrar transacciones de hoy
    const today = new Date().toISOString().split('T')[0];
    const transaccionesHoy = transacciones.filter(t => {
      const fecha = new Date(t.fecha).toISOString().split('T')[0];
      return fecha === today;
    });

    const ingresos = transaccionesHoy.filter(t => t.tipo === 'ingreso');
    const gastos = transaccionesHoy.filter(t => t.tipo === 'gasto');
    
    const totalEfectivo = ingresos
      .filter(i => i.metodo === 'efectivo')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const totalBanco = ingresos
      .filter(i => i.metodo === 'banco')
      .reduce((sum, i) => sum + parseFloat(i.monto), 0);
    
    const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    
    // Calcular taxes
    const taxRate = config.taxRate;
    const taxEfectivo = totalEfectivo * (taxRate / 100);
    const taxBanco = totalBanco * (taxRate / 100);
    const totalTax = taxEfectivo + taxBanco;
    
    // Ingreso neto después de taxes
    const netoEfectivo = totalEfectivo - taxEfectivo;
    const netoBanco = totalBanco - taxBanco;
    
    const gananciaNeta = (netoEfectivo + netoBanco) - totalGastos;
    
    const cajaChica = config.cajaChicaAdmin;
    
    // Calcular distribución sobre el INGRESO NETO
    const distribucionEfectivo = {
      ahorro: netoEfectivo * config.porcentajeAhorro / 100,
      inversion: netoEfectivo * config.porcentajeInversion / 100,
      emergencia: netoEfectivo * config.porcentajeEmergencia / 100,
      disponible: netoEfectivo * config.porcentajeDisponible / 100,
    };
    
    const distribucionBanco = {
      ahorro: netoBanco * config.porcentajeAhorro / 100,
      inversion: netoBanco * config.porcentajeInversion / 100,
      emergencia: netoBanco * config.porcentajeEmergencia / 100,
      disponible: netoBanco * config.porcentajeDisponible / 100,
    };
    
    // Datos para gráfica de evolución (últimos 7 días)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transacciones.filter(t => {
        const tDate = new Date(t.fecha).toISOString().split('T')[0];
        return tDate === dateStr;
      });
      
      const dayIngresos = dayTransactions
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + parseFloat(t.monto), 0);
      
      const dayGastos = dayTransactions
        .filter(t => t.tipo === 'gasto')
        .reduce((sum, t) => sum + parseFloat(t.monto), 0);
      
      last7Days.push({
        fecha: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        ingresos: dayIngresos,
        gastos: dayGastos,
        ganancia: dayIngresos - dayGastos,
      });
    }
    
    // Datos para gráfica de distribución de gastos por categoría
    const gastosPorCategoria: Record<string, number> = {};
    gastos.forEach(gasto => {
      const cat = gasto.categoria || 'Otros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + parseFloat(gasto.monto);
    });
    
    const gastosChartData = Object.entries(gastosPorCategoria).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Gráfica mensual — últimos 6 meses
    const monthlyData: Record<string, { mes: string; ingresos: number; gastos: number; ganancia: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      monthlyData[key] = { mes: label, ingresos: 0, gastos: 0, ganancia: 0 };
    }
    transaccionesMensuales.forEach(t => {
      const d = new Date(t.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) return;
      const monto = parseFloat(t.monto);
      if (t.tipo === 'ingreso') monthlyData[key].ingresos += monto;
      else monthlyData[key].gastos += monto;
    });
    Object.values(monthlyData).forEach(m => { m.ganancia = m.ingresos - m.gastos; });

    const monthlyChartData = Object.values(monthlyData);

    return {
      totalEfectivo,
      totalBanco,
      totalGastos,
      taxEfectivo,
      taxBanco,
      totalTax,
      netoEfectivo,
      netoBanco,
      gananciaNeta,
      cajaChica,
      distribucionEfectivo,
      distribucionBanco,
      evolutionData: last7Days,
      gastosChartData,
      monthlyChartData,
      config,
    };
  }, [user, transacciones, configData]);

  if (loadingTransactions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen financiero del día - {user?.name}
          </p>
        </div>

        {/* Tarjetas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ingresos Efectivo</p>
                <p className="text-2xl font-bold text-green-700">${data.totalEfectivo.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">Tax: ${data.taxEfectivo.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Ingresos Banco</p>
                <p className="text-2xl font-bold text-blue-700">${data.totalBanco.toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-1">Tax: ${data.taxBanco.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Landmark className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Gastos del Día</p>
                <p className="text-2xl font-bold text-red-700">${data.totalGastos.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </Card>

          <Card className={cn(
            "p-6 border",
            data.gananciaNeta >= 0 
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
              : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  data.gananciaNeta >= 0 ? "text-emerald-600" : "text-orange-600"
                )}>Ganancia Neta</p>
                <p className={cn(
                  "text-2xl font-bold",
                  data.gananciaNeta >= 0 ? "text-emerald-700" : "text-orange-700"
                )}>${data.gananciaNeta.toFixed(2)}</p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                data.gananciaNeta >= 0 ? "bg-emerald-200" : "bg-orange-200"
              )}>
                <TrendingUp className={cn(
                  "h-6 w-6",
                  data.gananciaNeta >= 0 ? "text-emerald-700" : "text-orange-700"
                )} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Taxes del Día</p>
                <p className="text-2xl font-bold text-orange-700">${data.totalTax.toFixed(2)}</p>
                <p className="text-xs text-orange-600 mt-1">Tasa: {data.config.taxRate}%</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Receipt className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Caja Chica</p>
                <p className="text-2xl font-bold text-purple-700">${data.cajaChica.toFixed(2)}</p>
                <p className="text-xs text-purple-600 mt-1">Principal</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Wallet className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Distribución de ingresos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Distribución Efectivo (Neto: ${data.netoEfectivo.toFixed(2)})
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Ahorro ({data.config.porcentajeAhorro}%)</span>
                <span className="font-bold text-green-800">${data.distribucionEfectivo.ahorro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Inversión ({data.config.porcentajeInversion}%)</span>
                <span className="font-bold text-blue-800">${data.distribucionEfectivo.inversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Emergencia ({data.config.porcentajeEmergencia}%)</span>
                <span className="font-bold text-yellow-800">${data.distribucionEfectivo.emergencia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700">Disponible ({data.config.porcentajeDisponible}%)</span>
                <span className="font-bold text-purple-800">${data.distribucionEfectivo.disponible.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Distribución Banco (Neto: ${data.netoBanco.toFixed(2)})
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Ahorro ({data.config.porcentajeAhorro}%)</span>
                <span className="font-bold text-green-800">${data.distribucionBanco.ahorro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700">Inversión ({data.config.porcentajeInversion}%)</span>
                <span className="font-bold text-blue-800">${data.distribucionBanco.inversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700">Emergencia ({data.config.porcentajeEmergencia}%)</span>
                <span className="font-bold text-yellow-800">${data.distribucionBanco.emergencia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700">Disponible ({data.config.porcentajeDisponible}%)</span>
                <span className="font-bold text-purple-800">${data.distribucionBanco.disponible.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfica Mensual de Ganancias — últimos 6 meses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ganancia Mensual — Últimos 6 Meses
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Ganancia neta mensual de Fixopolis Solutions</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="ganancia" name="Ganancia" fill="#3B82F6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolución Semanal
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#10B981" name="Ingresos" />
                  <Line type="monotone" dataKey="gastos" stroke="#EF4444" name="Gastos" />
                  <Line type="monotone" dataKey="ganancia" stroke="#3B82F6" name="Ganancia" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución de Gastos</h3>
            <div className="h-[300px]">
              {data.gastosChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.gastosChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.gastosChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay gastos registrados hoy
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
// Monthly chart section added below main component - see DashboardMonthlyChart component
