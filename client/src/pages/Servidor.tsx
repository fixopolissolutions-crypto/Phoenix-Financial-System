import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Server, Plus, RefreshCw, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SERVICIOS_COMUNES = [
  'MOTOROLA FRP | MDM QUALCOMM LATAM | USA [XT21/XT22/XT23 SERIES]',
  'MOTOROLA FRP | MDM QUALCOMM LATAM | USA [XT24/XT25 SERIES]',
  'SAMSUNG FRP BYPASS',
  'SAMSUNG CPID',
  'UNLOCK ATT USA',
  'UNLOCK TELCEL',
  'UNLOCK MOVISTAR',
  'BYPASS HONOR',
];

export default function Servidor() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [servicio, setServicio] = useState('');
  const [imei, setImei] = useState('');
  const [notas, setNotas] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const { data: requests = [], refetch, isLoading } = trpc.servidor.list.useQuery();

  const createMutation = trpc.servidor.create.useMutation({
    onSuccess: () => {
      toast.success('Solicitud enviada a UnlockerFast');
      refetch();
      setDialogOpen(false);
      setServicio('');
      setImei('');
      setNotas('');
    },
    onError: (error) => {
      toast.error('Error al enviar solicitud: ' + error.message);
    },
  });

  const checkStatusMutation = trpc.servidor.checkStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Estado actualizado: ${data.estado}`);
      refetch();
    },
    onError: (error) => {
      toast.error('Error al verificar estado: ' + error.message);
    },
  });

  const deleteMutation = trpc.servidor.delete.useMutation({
    onSuccess: () => {
      toast.success('Solicitud eliminada');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Auto-refresh cada 30 segundos para solicitudes pendientes/en proceso
  const autoRefresh = useCallback(() => {
    if (!autoRefreshEnabled) return;
    const pendingRequests = requests.filter(r =>
      r.estado === 'pending' || r.estado === 'processing' || r.estado === 'In Progress'
    );
    if (pendingRequests.length > 0) {
      pendingRequests.forEach(r => {
        if (r.orderId) {
          checkStatusMutation.mutate({ id: r.id, orderId: r.orderId });
        }
      });
    }
  }, [requests, autoRefreshEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      autoRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch, autoRefresh]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicio.trim()) {
      toast.error('El servicio es requerido');
      return;
    }
    if (!imei.trim()) {
      toast.error('El IMEI es requerido');
      return;
    }
    createMutation.mutate({ servicio, imei, notas: notas || undefined });
  };

  const getEstadoBadge = (estado: string) => {
    const lower = estado.toLowerCase();
    if (lower === 'success' || lower === 'completed' || lower === 'complete') {
      return { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> };
    }
    if (lower === 'error' || lower === 'failed' || lower === 'api_error') {
      return { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3.5 w-3.5" /> };
    }
    if (lower === 'processing' || lower === 'in progress') {
      return { color: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> };
    }
    return { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3.5 w-3.5" /> };
  };

  const pendingCount = requests.filter(r =>
    r.estado === 'pending' || r.estado === 'processing' || r.estado === 'In Progress'
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8 text-indigo-600" />
              🖥️ Servidor — UnlockerFast
            </h1>
            <p className="text-muted-foreground">
              Gestión de solicitudes de desbloqueo e IMEI
              {autoRefreshEnabled && pendingCount > 0 && (
                <span className="ml-2 text-xs text-blue-600">
                  · Auto-refresh activo ({pendingCount} pendiente{pendingCount > 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { refetch(); toast.info('Lista actualizada'); }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button
              variant={autoRefreshEnabled ? 'default' : 'outline'}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              size="sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              {autoRefreshEnabled ? 'Auto ON' : 'Auto OFF'}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud UnlockerFast</DialogTitle>
                  <DialogDescription>
                    Envía una solicitud de desbloqueo o servicio IMEI
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="servicio">Servicio *</Label>
                    <Input
                      id="servicio"
                      value={servicio}
                      onChange={(e) => setServicio(e.target.value)}
                      placeholder="Nombre del servicio"
                      required
                      list="servicios-list"
                    />
                    <datalist id="servicios-list">
                      {SERVICIOS_COMUNES.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">
                      Escribe o selecciona de los servicios comunes
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="imei">IMEI / Número de Serie *</Label>
                    <Input
                      id="imei"
                      value={imei}
                      onChange={(e) => setImei(e.target.value)}
                      placeholder="352999112345678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Solicitud'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <p className="text-sm font-medium text-indigo-600">Total</p>
            <p className="text-2xl font-bold text-indigo-700">{requests.length}</p>
          </Card>
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm font-medium text-yellow-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm font-medium text-green-600">Completados</p>
            <p className="text-2xl font-bold text-green-700">
              {requests.filter(r => r.estado === 'success' || r.estado === 'completed' || r.estado === 'complete').length}
            </p>
          </Card>
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-sm font-medium text-red-600">Errores</p>
            <p className="text-2xl font-bold text-red-700">
              {requests.filter(r => r.estado === 'error' || r.estado === 'failed' || r.estado === 'api_error').length}
            </p>
          </Card>
        </div>

        {/* Tabla de solicitudes */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" />
              Historial de Solicitudes
            </h3>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay solicitudes registradas</p>
              <p className="text-sm text-gray-400 mt-1">Crea una nueva solicitud para empezar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Servicio</th>
                    <th className="text-left p-3 font-medium text-gray-600">IMEI</th>
                    <th className="text-left p-3 font-medium text-gray-600">Estado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Order ID</th>
                    <th className="text-left p-3 font-medium text-gray-600">Costo</th>
                    <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-left p-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req: any) => {
                    const badge = getEstadoBadge(req.estado);
                    const isPending = req.estado === 'pending' || req.estado === 'processing' || req.estado === 'In Progress';
                    return (
                      <tr key={req.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <p className="font-medium max-w-[200px] truncate" title={req.servicio}>
                            {req.servicio}
                          </p>
                          {req.notas && (
                            <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{req.notas}</p>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs">{req.imei}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.icon}
                            {req.estado}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-600">
                          {req.orderId || '—'}
                        </td>
                        <td className="p-3">
                          {req.costo ? `$${Number(req.costo).toFixed(2)}` : '—'}
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {new Date(req.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit', month: 'short', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {isPending && req.orderId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkStatusMutation.mutate({ id: req.id, orderId: req.orderId })}
                                disabled={checkStatusMutation.isPending}
                                title="Verificar estado"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${checkStatusMutation.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('¿Eliminar esta solicitud?')) {
                                  deleteMutation.mutate({ id: req.id });
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
