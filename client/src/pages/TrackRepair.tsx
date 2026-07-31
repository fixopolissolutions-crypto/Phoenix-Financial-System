import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Search, Wrench, CheckCircle, Package, Clock, Truck, AlertCircle, Shield, Calendar } from 'lucide-react';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; step: number }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock,        step: 1 },
  en_proceso:  { label: 'En Proceso',  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: Wrench,       step: 2 },
  completada:  { label: 'Completada',  color: 'text-green-600',  bg: 'bg-green-100',  icon: CheckCircle,  step: 3 },
  entregada:   { label: 'Entregada',   color: 'text-purple-600', bg: 'bg-purple-100', icon: Truck,        step: 4 },
};

const STEPS = [
  { key: 'pendiente',  label: 'Recibido',    icon: Package },
  { key: 'en_proceso', label: 'En Reparación', icon: Wrench },
  { key: 'completada', label: 'Listo',        icon: CheckCircle },
  { key: 'entregada',  label: 'Entregado',    icon: Truck },
];

function formatDate(d: any) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TrackRepair() {
  const [inputCode, setInputCode] = useState('');
  const [searchCode, setSearchCode] = useState('');

  const { data: repair, isLoading, error } = trpc.track.byCode.useQuery(
    { codigo: searchCode },
    { enabled: !!searchCode }
  );
  const { data: statusLog } = trpc.track.statusLog.useQuery(
    { codigo: searchCode },
    { enabled: !!searchCode && !!repair }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) setSearchCode(inputCode.trim().toUpperCase());
  };

  const estadoInfo = repair ? (ESTADO_CONFIG[repair.estado] || ESTADO_CONFIG['pendiente']) : null;
  const currentStep = estadoInfo?.step ?? 0;

  // Calcular garantía
  const garantiaVence = repair?.garantiaVence ? new Date(repair.garantiaVence) : null;
  const garantiaActiva = garantiaVence ? garantiaVence > new Date() : false;
  const diasGarantia = garantiaVence
    ? Math.ceil((garantiaVence.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fixopolis</h1>
            <p className="text-xs text-gray-500">Rastreo de Reparación</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Consulta el estado de tu reparación</h2>
          <p className="text-sm text-gray-500 mb-4">Ingresa el código de tu orden (ej: ADM-001)</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="Código de orden (ej: ADM-001)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 uppercase"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </form>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Buscando tu orden...</p>
          </div>
        )}

        {/* No encontrado */}
        {searchCode && !isLoading && repair === null && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Orden no encontrada</h3>
            <p className="text-sm text-gray-500">No encontramos ninguna reparación con el código <strong>{searchCode}</strong>. Verifica el código e intenta de nuevo.</p>
          </div>
        )}

        {/* Resultado */}
        {repair && estadoInfo && (
          <>
            {/* Tarjeta principal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Estado banner */}
              <div className={`${estadoInfo.bg} px-6 py-4 flex items-center gap-3`}>
                <estadoInfo.icon className={`h-6 w-6 ${estadoInfo.color}`} />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Estado actual</p>
                  <p className={`text-xl font-bold ${estadoInfo.color}`}>{estadoInfo.label}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Orden</p>
                  <p className="text-lg font-bold text-gray-800">{repair.codigo}</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between relative">
                  {/* Línea de fondo */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 z-0" />
                  {/* Línea de progreso */}
                  <div
                    className="absolute top-5 left-0 h-1 bg-orange-400 z-0 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />
                  {STEPS.map((step, i) => {
                    const done = i + 1 < currentStep;
                    const active = i + 1 === currentStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                          ${done ? 'bg-orange-500 border-orange-500' : active ? 'bg-white border-orange-500' : 'bg-white border-gray-200'}`}>
                          <Icon className={`h-5 w-5 ${done ? 'text-white' : active ? 'text-orange-500' : 'text-gray-300'}`} />
                        </div>
                        <p className={`text-xs mt-1 font-medium text-center ${active ? 'text-orange-600' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detalles */}
              <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                  <p className="text-sm font-semibold text-gray-800">{repair.cliente || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Dispositivo</p>
                  <p className="text-sm font-semibold text-gray-800">{repair.dispositivo || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Fecha de ingreso</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(repair.fechaIngreso) || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Técnico</p>
                  <p className="text-sm font-semibold text-gray-800">{repair.tecnico || 'Por asignar'}</p>
                </div>
                {repair.problema && (
                  <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Problema reportado</p>
                    <p className="text-sm text-gray-700">{repair.problema}</p>
                  </div>
                )}
                {repair.fechaCompletado && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 mb-0.5">Completado</p>
                    <p className="text-sm font-semibold text-green-700">{formatDate(repair.fechaCompletado)}</p>
                  </div>
                )}
                {repair.fechaEntrega && (
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs text-purple-600 mb-0.5">Entregado</p>
                    <p className="text-sm font-semibold text-purple-700">{formatDate(repair.fechaEntrega)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Garantía */}
            {garantiaVence && repair.estado === 'entregada' && (
              <div className={`rounded-2xl border p-4 flex items-center gap-4 ${garantiaActiva ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <Shield className={`h-8 w-8 flex-shrink-0 ${garantiaActiva ? 'text-green-500' : 'text-red-400'}`} />
                <div>
                  <p className={`font-semibold ${garantiaActiva ? 'text-green-700' : 'text-red-600'}`}>
                    {garantiaActiva ? `Garantía vigente — ${diasGarantia} días restantes` : 'Garantía vencida'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vence: {formatDate(garantiaVence)} · {repair.garantiaDias} días de garantía
                  </p>
                </div>
              </div>
            )}

            {/* Historial de estados */}
            {statusLog && statusLog.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Historial de cambios
                </h3>
                <div className="space-y-3">
                  {(statusLog as any[]).map((log: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                        {i < statusLog.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-800">
                          {ESTADO_CONFIG[log.estadoNuevo]?.label || log.estadoNuevo}
                        </p>
                        {log.nota && <p className="text-xs text-gray-500 mt-0.5">{log.nota}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Fixopolis · Servicio de Reparaciones
      </footer>
    </div>
  );
}
