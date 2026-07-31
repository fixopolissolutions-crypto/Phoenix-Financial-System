import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import {
  DollarSign, TrendingUp, TrendingDown, Activity, Receipt, Landmark,
  Loader2, Wallet, Wrench, Plus, Minus, ArrowUpRight, ArrowDownRight,
  ChevronRight, AlertTriangle, Package, UserCog, ShoppingCart,
  Clock, CheckCircle2, Timer, BarChart2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { useLocation } from 'wouter';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const utils = trpc.useContext();

  const { data: transacciones = [], isLoading: loadingTransactions } = trpc.transactions.list.useQuery({ tienda: 'admin' });

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

  const { data: reparaciones = [] } = trpc.repairs.list.useQuery();
  const { data: configData = {} } = trpc.config.getAll.useQuery();
  const { data: topProducts = [] } = trpc.dashboardStats.topProducts.useQuery({ limit: 8 });
  const { data: topTechnicians = [] } = trpc.dashboardStats.topTechnicians.useQuery();
  const { data: stockBajo = [] } = trpc.dashboardStats.stockBajo.useQuery();
  const { data: repairStats } = trpc.dashboardStats.repairStats.useQuery();

  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        utils.transactions.list.invalidate();
        utils.config.getAll.invalidate();
      }
    }, 60000);
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
    };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const transHoy = transacciones.filter(t => new Date(t.fecha).toISOString().split('T')[0] === today);
    const transAyer = transacciones.filter(t => new Date(t.fecha).toISOString().split('T')[0] === yesterday);

    const calcTotals = (trans: typeof transacciones) => {
      const efectivo = trans.filter(t => t.tipo === 'ingreso' && t.metodo === 'efectivo').reduce((s, t) => s + parseFloat(t.monto), 0);
      const banco = trans.filter(t => t.tipo === 'ingreso' && t.metodo === 'banco').reduce((s, t) => s + parseFloat(t.monto), 0);
      const gastos = trans.filter(t => t.tipo === 'gasto').reduce((s, t) => s + parseFloat(t.monto), 0);
      return { efectivo, banco, gastos, ganancia: efectivo + banco - gastos };
    };

    const hoy = calcTotals(transHoy);
    const ayer = calcTotals(transAyer);

    const taxEfectivo = hoy.efectivo * (config.taxRate / 100);
    const taxBanco = hoy.banco * (config.taxRate / 100);
    const totalTax = taxEfectivo + taxBanco;
    const netoEfectivo = hoy.efectivo - taxEfectivo;
    const netoBanco = hoy.banco - taxBanco;
    const gananciaNeta = (netoEfectivo + netoBanco) - hoy.gastos;

    const pct = (curr: number, prev: number) => prev === 0 ? null : ((curr - prev) / prev) * 100;

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

    // Last 7 days evolution
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTrans = transacciones.filter(t => new Date(t.fecha).toISOString().split('T')[0] === dateStr);
      const dayIngresos = dayTrans.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + parseFloat(t.monto), 0);
      const dayGastos = dayTrans.filter(t => t.tipo === 'gasto').reduce((s, t) => s + parseFloat(t.monto), 0);
      last7Days.push({
        fecha: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        ingresos: dayIngresos,
        gastos: dayGastos,
        ganancia: dayIngresos - dayGastos,
      });
    }

    // Gastos por categoría
    const gastosPorCategoria: Record<string, number> = {};
    transHoy.filter(t => t.tipo === 'gasto').forEach(g => {
      const cat = g.categoria || 'Otros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + parseFloat(g.monto);
    });
    const gastosChartData = Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value }));

    // Monthly chart
    const monthlyData: Record<string, { mes: string; ganancia: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      monthlyData[key] = { mes: label, ganancia: 0 };
    }
    transaccionesMensuales.forEach(t => {
      const d = new Date(t.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) return;
      const monto = parseFloat(t.monto);
      if (t.tipo === 'ingreso') monthlyData[key].ganancia += monto;
      else monthlyData[key].ganancia -= monto;
    });
    const monthlyChartData = Object.values(monthlyData);

    // Reparaciones hoy
    const repHoy = reparaciones.filter(r => {
      const fecha = r.fechaIngreso ? new Date(r.fechaIngreso).toISOString().split('T')[0] : '';
      return fecha === today;
    });

    return {
      totalEfectivo: hoy.efectivo,
      totalBanco: hoy.banco,
      totalGastos: hoy.gastos,
      taxEfectivo, taxBanco, totalTax,
      netoEfectivo, netoBanco, gananciaNeta,
      cajaChica: config.cajaChicaAdmin,
      distribucionEfectivo, distribucionBanco,
      evolutionData: last7Days,
      gastosChartData,
      monthlyChartData,
      config,
      trends: {
        efectivo: pct(hoy.efectivo, ayer.efectivo),
        banco: pct(hoy.banco, ayer.banco),
        gastos: pct(hoy.gastos, ayer.gastos),
        ganancia: pct(gananciaNeta, calcTotals(transAyer).ganancia),
      },
      repHoy: repHoy.length,
      repPendientes: reparaciones.filter(r => r.estado === 'pendiente').length,
      repEnProceso: reparaciones.filter(r => r.estado === 'en_proceso').length,
    };
  }, [user, transacciones, transaccionesMensuales, configData, reparaciones]);

  if (loadingTransactions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const TrendBadge = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const positive = value >= 0;
    return (
      <span className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
        positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      )}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Resumen financiero del día — Fixopolis Solutions
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            En vivo
          </div>
        </div>

        {/* Panel de Turno Rápido */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Panel de Turno Rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setLocation('/reparaciones')}
              className="group flex items-center gap-4 p-5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base">Nueva Reparación</p>
                <p className="text-blue-200 text-xs mt-0.5">Crear una orden de reparación</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setLocation('/ingresos')}
              className="group flex items-center gap-4 p-5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base">Registrar Ingreso</p>
                <p className="text-green-200 text-xs mt-0.5">Agregar un nuevo ingreso</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setLocation('/gastos')}
              className="group flex items-center gap-4 p-5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Minus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base">Registrar Gasto</p>
                <p className="text-red-200 text-xs mt-0.5">Agregar un nuevo gasto</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Ingresos Efectivo */}
          <Card className="p-4 border-0 shadow-sm bg-white col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <TrendBadge value={data.trends.efectivo} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Efectivo</p>
            <p className="text-xl font-bold text-gray-900">${data.totalEfectivo.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tax: ${data.taxEfectivo.toFixed(2)}</p>
          </Card>

          {/* Ingresos Banco */}
          <Card className="p-4 border-0 shadow-sm bg-white col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-blue-600" />
              </div>
              <TrendBadge value={data.trends.banco} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Banco</p>
            <p className="text-xl font-bold text-gray-900">${data.totalBanco.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tax: ${data.taxBanco.toFixed(2)}</p>
          </Card>

          {/* Gastos */}
          <Card className="p-4 border-0 shadow-sm bg-white col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <TrendBadge value={data.trends.gastos !== null ? -data.trends.gastos : null} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Gastos</p>
            <p className="text-xl font-bold text-gray-900">${data.totalGastos.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Hoy</p>
          </Card>

          {/* Ganancia Neta */}
          <Card className={cn(
            "p-4 border-0 shadow-sm col-span-1",
            data.gananciaNeta >= 0 ? "bg-emerald-50" : "bg-orange-50"
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                data.gananciaNeta >= 0 ? "bg-emerald-100" : "bg-orange-100"
              )}>
                <TrendingUp className={cn("w-4 h-4", data.gananciaNeta >= 0 ? "text-emerald-600" : "text-orange-600")} />
              </div>
              <TrendBadge value={data.trends.ganancia} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Ganancia Neta</p>
            <p className={cn("text-xl font-bold", data.gananciaNeta >= 0 ? "text-emerald-700" : "text-orange-700")}>
              ${data.gananciaNeta.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">vs ayer</p>
          </Card>

          {/* Taxes */}
          <Card className="p-4 border-0 shadow-sm bg-white col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Taxes</p>
            <p className="text-xl font-bold text-gray-900">${data.totalTax.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tasa: {data.config.taxRate}%</p>
          </Card>

          {/* Caja Chica */}
          <Card className="p-4 border-0 shadow-sm bg-white col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Caja Chica</p>
            <p className="text-xl font-bold text-gray-900">${data.cajaChica.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Principal</p>
          </Card>
        </div>

        {/* Reparaciones resumen + Distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Resumen reparaciones */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Reparaciones</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hoy</span>
                <span className="font-bold text-gray-900">{data.repHoy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {data.repPendientes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En Proceso</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  {data.repEnProceso}
                </span>
              </div>
            </div>
            <button
              onClick={() => setLocation('/reparaciones')}
              className="mt-4 w-full text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </Card>

          {/* Distribución Efectivo */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Distribución Efectivo
            </h3>
            <div className="space-y-2">
              {[
                { label: `Ahorro (${data.config.porcentajeAhorro}%)`, value: data.distribucionEfectivo.ahorro, color: 'bg-green-500' },
                { label: `Inversión (${data.config.porcentajeInversion}%)`, value: data.distribucionEfectivo.inversion, color: 'bg-blue-500' },
                { label: `Emergencia (${data.config.porcentajeEmergencia}%)`, value: data.distribucionEfectivo.emergencia, color: 'bg-yellow-500' },
                { label: `Disponible (${data.config.porcentajeDisponible}%)`, value: data.distribucionEfectivo.disponible, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', item.color)}></span>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Distribución Banco */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Distribución Banco
            </h3>
            <div className="space-y-2">
              {[
                { label: `Ahorro (${data.config.porcentajeAhorro}%)`, value: data.distribucionBanco.ahorro, color: 'bg-green-500' },
                { label: `Inversión (${data.config.porcentajeInversion}%)`, value: data.distribucionBanco.inversion, color: 'bg-blue-500' },
                { label: `Emergencia (${data.config.porcentajeEmergencia}%)`, value: data.distribucionBanco.emergencia, color: 'bg-yellow-500' },
                { label: `Disponible (${data.config.porcentajeDisponible}%)`, value: data.distribucionBanco.disponible, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', item.color)}></span>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Chart */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Ganancia Mensual</h3>
                <p className="text-xs text-gray-400">Últimos 6 meses</p>
              </div>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ganancia']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="ganancia" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Weekly Evolution */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Evolución Semanal</h3>
                <p className="text-xs text-gray-400">Últimos 7 días</p>
              </div>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ingresos" stroke="#10B981" name="Ingresos" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gastos" stroke="#EF4444" name="Gastos" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ganancia" stroke="#F97316" name="Ganancia" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Gastos por categoría */}
        {data.gastosChartData.length > 0 && (
          <Card className="p-5 border-0 shadow-sm bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribución de Gastos Hoy</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gastosChartData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {data.gastosChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top Productos + Top Técnicos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Productos más vendidos */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Top Productos Vendidos</h3>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin datos de ventas POS</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name === 'cantidad' ? 'Unidades' : 'Total $']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    />
                    <Bar dataKey="cantidad" name="cantidad" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top Técnicos */}
          <Card className="p-5 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Rendimiento de Técnicos</h3>
            </div>
            {topTechnicians.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin técnicos asignados aún</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTechnicians} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="tecnico" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      formatter={(value: number, name: string) => [name === 'total' ? `${value} reparaciones` : `$${Number(value).toFixed(2)}`, name === 'total' ? 'Reparaciones' : 'Ganancia']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    />
                    <Bar dataKey="total" name="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* ═══ MÉTRICAS DE REPARACIONES ═══ */}
        {repairStats && (
          <>
            {/* KPIs de reparaciones */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-orange-600" />
                  </div>
                  {repairStats.esteMes.total > repairStats.mesPasado.total ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {repairStats.mesPasado.total > 0 ? Math.round(((repairStats.esteMes.total - repairStats.mesPasado.total) / repairStats.mesPasado.total) * 100) : 100}%
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      {repairStats.mesPasado.total > 0 ? Math.round(((repairStats.mesPasado.total - repairStats.esteMes.total) / repairStats.mesPasado.total) * 100) : 0}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{repairStats.esteMes.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Reparaciones este mes</p>
              </Card>
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(repairStats.porEstado['pendiente'] || 0) + (repairStats.porEstado['en_proceso'] || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">En espera / proceso</p>
              </Card>
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">${repairStats.esteMes.ganancia.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Ganancia reparaciones</p>
              </Card>
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {repairStats.tiempoPromedioHoras > 0
                    ? repairStats.tiempoPromedioHoras < 24
                      ? `${Math.round(repairStats.tiempoPromedioHoras)}h`
                      : `${Math.round(repairStats.tiempoPromedioHoras / 24)}d`
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Tiempo promedio</p>
              </Card>
            </div>

            {/* Gráfica semanal + Reparaciones demoradas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Gráfica de reparaciones por semana */}
              <Card className="lg:col-span-2 p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Reparaciones Últimas 8 Semanas</h3>
                </div>
                {repairStats.porSemana.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Sin datos de reparaciones aún</p>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={repairStats.porSemana} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name === 'total' ? 'Total' : 'Completadas']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        />
                        <Bar dataKey="total" name="total" fill="#F97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completadas" name="completadas" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Reparaciones demoradas */}
              <Card className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Reparaciones Demoradas</h3>
                </div>
                {repairStats.demoradas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <p className="text-xs text-gray-400">Sin reparaciones demoradas</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {repairStats.demoradas.map((r: any) => (
                      <div key={r.id} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-3 h-3 text-red-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{r.codigo}</p>
                          <p className="text-xs text-gray-500 truncate">{r.cliente || 'Sin nombre'}</p>
                          <p className="text-xs text-red-600 font-medium">{r.diasSinCambio} días sin cambio</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setLocation('/reparaciones')}
                  className="mt-3 w-full text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1"
                >
                  Ver todas <ChevronRight className="w-3 h-3" />
                </button>
              </Card>
            </div>
          </>
        )}

        {/* Alertas de Stock Bajo */}
        {stockBajo.length > 0 && (
          <Card className="p-5 border-0 shadow-sm bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">Alertas de Stock Bajo ({stockBajo.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {stockBajo.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-amber-100">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.nombre}</p>
                    <p className="text-xs text-amber-600">{item.cantidadActual} / {item.stockMinimo} mín.</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
