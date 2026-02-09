import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Wrench, Plus, DollarSign, Clock, CheckCircle, Package, Trash2, FileText } from 'lucide-react';
import { FacturaReparacion } from '@/components/FacturaReparacion';
import { toast } from 'sonner';

export default function Reparaciones() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'completada' | 'entregada'>('todos');
  const [facturaDialogOpen, setFacturaDialogOpen] = useState(false);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState<any>(null);

  // Queries
  const { data: repairs = [], refetch } = trpc.repairs.list.useQuery();
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  
  // Mutations
  const createMutation = trpc.repairs.create.useMutation({
    onSuccess: () => {
      toast.success('Reparación registrada exitosamente');
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Error al registrar reparación: ' + error.message);
    },
  });

  const updateMutation = trpc.repairs.update.useMutation({
    onSuccess: () => {
      toast.success('Reparación actualizada exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al actualizar reparación: ' + error.message);
    },
  });

  const deleteMutation = trpc.repairs.delete.useMutation({
    onSuccess: () => {
      toast.success('Reparación eliminada exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar reparación: ' + error.message);
    },
  });

  // Filtrar reparaciones
  const repairsFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return repairs;
    return repairs.filter(r => r.estado === filtroEstado);
  }, [repairs, filtroEstado]);

  // Calcular totales
  const totales = useMemo(() => {
    const pendientes = repairs.filter(r => r.estado === 'pendiente').length;
    const enProceso = repairs.filter(r => r.estado === 'en_proceso').length;
    const completadas = repairs.filter(r => r.estado === 'completada' || r.estado === 'entregada').length;
    
    const ingresoTotal = repairs
      .filter(r => r.estado === 'completada' || r.estado === 'entregada')
      .reduce((sum, r) => sum + Number(r.precioTotal), 0);
    
    const costoPartes = repairs
      .filter(r => r.estado === 'completada' || r.estado === 'entregada')
      .reduce((sum, r) => sum + Number(r.costoPartes), 0);
    
    const gananciaTotal = repairs
      .filter(r => r.estado === 'completada' || r.estado === 'entregada')
      .reduce((sum, r) => sum + Number(r.ganancia), 0);

    return {
      pendientes,
      enProceso,
      completadas,
      total: repairs.length,
      ingresoTotal,
      costoPartes,
      gananciaTotal,
    };
  }, [repairs]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      cliente: formData.get('cliente') as string || undefined,
      telefono: formData.get('telefono') as string || undefined,
      dispositivo: formData.get('dispositivo') as string,
      problema: formData.get('problema') as string,
      diagnostico: formData.get('diagnostico') as string || undefined,
      precioManoObra: formData.get('precioManoObra') as string,
      precioTotal: formData.get('precioTotal') as string,
      fechaIngreso: formData.get('fechaIngreso') as string,
      notas: formData.get('notas') as string || undefined,
    });
  };

  const handleUpdateEstado = (id: number, nuevoEstado: string) => {
    const updateData: any = { id, estado: nuevoEstado as any };
    
    if (nuevoEstado === 'completada') {
      updateData.fechaCompletado = new Date().toISOString();
    } else if (nuevoEstado === 'entregada') {
      updateData.fechaEntrega = new Date().toISOString();
    }
    
    updateMutation.mutate(updateData);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta reparación?')) {
      deleteMutation.mutate({ id });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      en_proceso: 'bg-blue-100 text-blue-700',
      completada: 'bg-green-100 text-green-700',
      entregada: 'bg-gray-100 text-gray-700',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const getEstadoTexto = (estado: string) => {
    const textos = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completada: 'Completada',
      entregada: 'Entregada',
    };
    return textos[estado as keyof typeof textos] || estado;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              🔧 Reparaciones
            </h1>
            <p className="text-muted-foreground">
              Control de reparaciones y servicios
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reparación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Reparación</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de la reparación
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" placeholder="REP-001" required />
                  </div>
                  <div>
                    <Label htmlFor="fechaIngreso">Fecha de Ingreso *</Label>
                    <Input 
                      id="fechaIngreso" 
                      name="fechaIngreso" 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input id="cliente" name="cliente" placeholder="Nombre del cliente" />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" name="telefono" placeholder="555-1234" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dispositivo">Dispositivo *</Label>
                  <Input id="dispositivo" name="dispositivo" placeholder="iPhone 13 Pro" required />
                </div>

                <div>
                  <Label htmlFor="problema">Problema Reportado *</Label>
                  <Textarea id="problema" name="problema" placeholder="Descripción del problema" required />
                </div>

                <div>
                  <Label htmlFor="diagnostico">Diagnóstico</Label>
                  <Textarea id="diagnostico" name="diagnostico" placeholder="Diagnóstico técnico" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precioManoObra">Precio Mano de Obra *</Label>
                    <Input 
                      id="precioManoObra" 
                      name="precioManoObra" 
                      type="number" 
                      step="0.01" 
                      placeholder="50.00" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="precioTotal">Precio Total al Cliente *</Label>
                    <Input 
                      id="precioTotal" 
                      name="precioTotal" 
                      type="number" 
                      step="0.01" 
                      placeholder="100.00" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea id="notas" name="notas" placeholder="Observaciones adicionales" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-600">Pendientes</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{totales.pendientes}</p>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-600">En Proceso</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totales.enProceso}</p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-600">Completadas</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{totales.completadas}</p>
          </Card>

          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-600">Ganancia</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">${totales.gananciaTotal.toFixed(2)}</p>
            <p className="text-sm text-emerald-600">Neta</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filtrar por estado:</Label>
            <div className="flex gap-2">
              <Button
                variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({totales.total})
              </Button>
              <Button
                variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('pendiente')}
              >
                Pendientes ({totales.pendientes})
              </Button>
              <Button
                variant={filtroEstado === 'en_proceso' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('en_proceso')}
              >
                En Proceso ({totales.enProceso})
              </Button>
              <Button
                variant={filtroEstado === 'completada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('completada')}
              >
                Completadas ({totales.completadas})
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Reparaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repairsFiltradas.map((repair) => (
            <Card key={repair.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-mono text-gray-600">{repair.codigo}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadge(repair.estado)}`}>
                  {getEstadoTexto(repair.estado)}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-1">{repair.dispositivo}</h3>
              {repair.cliente && (
                <p className="text-sm text-gray-600 mb-1">Cliente: {repair.cliente}</p>
              )}
              {repair.telefono && (
                <p className="text-sm text-gray-600 mb-3">Tel: {repair.telefono}</p>
              )}

              <div className="bg-gray-50 p-3 rounded mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Problema:</p>
                <p className="text-sm text-gray-600">{repair.problema}</p>
              </div>

              {repair.diagnostico && (
                <div className="bg-blue-50 p-3 rounded mb-3">
                  <p className="text-sm font-medium text-blue-700 mb-1">Diagnóstico:</p>
                  <p className="text-sm text-blue-600">{repair.diagnostico}</p>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio Total:</span>
                  <span className="font-semibold text-green-600">${Number(repair.precioTotal).toFixed(2)}</span>
                </div>
                {(repair.estado === 'completada' || repair.estado === 'entregada') && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Costo Partes:</span>
                      <span className="font-semibold text-orange-600">-${Number(repair.costoPartes).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Ganancia:</span>
                      <span className="font-semibold text-emerald-600">${Number(repair.ganancia).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {repair.notas && (
                <p className="text-xs text-gray-500 mt-3 border-t pt-2">{repair.notas}</p>
              )}

              <div className="mt-4 space-y-2">
                {/* Botón de Factura (solo para completadas o entregadas) */}
                {(repair.estado === 'completada' || repair.estado === 'entregada') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setReparacionSeleccionada(repair);
                      setFacturaDialogOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Factura
                  </Button>
                )}
                
                {repair.estado === 'pendiente' && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateEstado(repair.id, 'en_proceso')}
                  >
                    Iniciar Reparación
                  </Button>
                )}
                {repair.estado === 'en_proceso' && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateEstado(repair.id, 'completada')}
                  >
                    Marcar Completada
                  </Button>
                )}
                {repair.estado === 'completada' && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateEstado(repair.id, 'entregada')}
                  >
                    Marcar Entregada
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(repair.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {repairsFiltradas.length === 0 && (
          <Card className="p-12 text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay reparaciones en esta categoría</p>
          </Card>
        )}
      </div>

      {/* Dialog de Factura */}
      <Dialog open={facturaDialogOpen} onOpenChange={setFacturaDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Factura de Reparación</DialogTitle>
            <DialogDescription>
              Generar factura para el cliente
            </DialogDescription>
          </DialogHeader>
          {reparacionSeleccionada && (
            <FacturaReparacion
              reparacion={{
                id: reparacionSeleccionada.id,
                cliente: reparacionSeleccionada.cliente || 'Cliente',
                telefono: reparacionSeleccionada.telefono || 'N/A',
                dispositivo: reparacionSeleccionada.dispositivo,
                problema: reparacionSeleccionada.problema,
                precio: Number(reparacionSeleccionada.precioTotal),
                fecha: new Date(reparacionSeleccionada.fechaIngreso),
                estado: reparacionSeleccionada.estado,
              }}
              taxRate={8.25}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
