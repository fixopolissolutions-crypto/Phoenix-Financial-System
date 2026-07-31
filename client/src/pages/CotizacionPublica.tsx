import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import {
  CheckCircle, XCircle, FileText, User, Phone, Smartphone,
  DollarSign, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ItemPresupuesto {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export default function CotizacionPublica() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [accionRealizada, setAccionRealizada] = useState<'aprobado' | 'rechazado' | null>(null);

  const { data: presupuesto, isLoading, error } = trpc.presupuestos.getByToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const aprobarMutation = trpc.presupuestos.aprobarPorToken.useMutation({
    onSuccess: (_, vars) => {
      setAccionRealizada(vars.accion);
      toast.success(vars.accion === 'aprobado' ? '✅ Cotización aprobada' : '❌ Cotización rechazada');
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-gray-500 text-sm">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (!presupuesto || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cotización no encontrada</h2>
          <p className="text-gray-500 text-sm">
            Este enlace no es válido o la cotización ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  let items: ItemPresupuesto[] = [];
  try { items = JSON.parse(presupuesto.items || '[]'); } catch {}

  const yaRespondida = presupuesto.estado === 'aprobado' || presupuesto.estado === 'rechazado' || presupuesto.estado === 'expirado';
  const accionFinal = accionRealizada || (yaRespondida ? presupuesto.estado as any : null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fixopolis</h1>
            <p className="text-sm text-gray-500">Cotización de Reparación</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Estado de acción */}
        {accionFinal === 'aprobado' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-1">¡Cotización Aprobada!</h2>
            <p className="text-green-600 text-sm">
              Hemos recibido tu aprobación. Te contactaremos pronto para coordinar la reparación.
            </p>
          </div>
        )}

        {accionFinal === 'rechazado' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-800 mb-1">Cotización Rechazada</h2>
            <p className="text-red-600 text-sm">
              Hemos recibido tu respuesta. Si cambias de opinión, contáctanos directamente.
            </p>
          </div>
        )}

        {accionFinal === 'expirado' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <Clock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-orange-800 mb-1">Cotización Expirada</h2>
            <p className="text-orange-600 text-sm">
              Esta cotización ya no está vigente. Contáctanos para una nueva cotización.
            </p>
          </div>
        )}

        {/* Código */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Número de Cotización</p>
              <p className="text-2xl font-bold text-orange-500">{presupuesto.codigo}</p>
            </div>
            {presupuesto.validoHasta && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Válida hasta</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(presupuesto.validoHasta).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Datos del cliente */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {presupuesto.clienteNombre && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span>{presupuesto.clienteNombre}</span>
              </div>
            )}
            {presupuesto.clienteTelefono && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{presupuesto.clienteTelefono}</span>
              </div>
            )}
            {(presupuesto.dispositivoMarca || presupuesto.dispositivoModelo) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="w-4 h-4 text-gray-400" />
                <span>{[presupuesto.dispositivoMarca, presupuesto.dispositivoModelo].filter(Boolean).join(' ')}</span>
              </div>
            )}
          </div>

          {/* Descripción del problema */}
          {presupuesto.descripcionProblema && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Problema Reportado</p>
              <p className="text-sm text-gray-700">{presupuesto.descripcionProblema}</p>
            </div>
          )}
        </div>

        {/* Ítems del presupuesto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            Desglose de Costos
          </h3>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.descripcion}</p>
                  <p className="text-xs text-gray-500">
                    {item.cantidad} × ${item.precioUnitario.toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${(item.cantidad * item.precioUnitario).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${parseFloat(presupuesto.subtotal || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Impuesto (8.25%)</span>
              <span>${parseFloat(presupuesto.impuesto || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-orange-500">${parseFloat(presupuesto.total || '0').toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {presupuesto.notas && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Notas adicionales</p>
            <p className="text-sm text-blue-600">{presupuesto.notas}</p>
          </div>
        )}

        {/* Botones de acción */}
        {!accionFinal && presupuesto.estado === 'enviado' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500">
              ¿Deseas aprobar esta cotización de reparación?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => aprobarMutation.mutate({ token: token!, accion: 'rechazado' })}
                disabled={aprobarMutation.isPending}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Rechazar
              </button>
              <button
                onClick={() => aprobarMutation.mutate({ token: token!, accion: 'aprobado' })}
                disabled={aprobarMutation.isPending}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {aprobarMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Aprobar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-4">
          <p>Fixopolis Solutions · fixopolisfinanzas.com</p>
          <p className="mt-1">+1 (567) 472-2954</p>
        </div>
      </div>
    </div>
  );
}
