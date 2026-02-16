import { useState, useMemo, useEffect } from 'react';
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
import { Wrench, Plus, DollarSign, Clock, CheckCircle, Package, Trash2, FileText, Search, X } from 'lucide-react';
import { FacturaReparacion } from '@/components/FacturaReparacion';
import { toast } from 'sonner';

interface ParteSeleccionada {
  id: string; // ID único temporal para React
  partId?: number; // ID de la parte en inventario (undefined si es externa)
  esExterna: boolean;
  nombre: string;
  cantidad: number;
  costoUnitario: string;
  cantidadDisponible?: number; // Solo para partes del inventario
}

export default function Reparaciones() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'completada' | 'entregada'>('todos');
  const [facturaDialogOpen, setFacturaDialogOpen] = useState(false);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState<any>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [partesSeleccionadas, setPartesSeleccionadas] = useState<ParteSeleccionada[]>([]);
  const [siguienteCodigo, setSiguienteCodigo] = useState('REP-001');
  const [precioTotal, setPrecioTotal] = useState<number>(0);

  // Queries
  const { data: repairs = [], refetch } = trpc.repairs.list.useQuery();
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const { data: nextCodeData } = trpc.repairs.getNextCode.useQuery();
  
  // Actualizar el código cuando se obtiene del servidor
  useEffect(() => {
    if (nextCodeData?.codigo) {
      setSiguienteCodigo(nextCodeData.codigo);
    }
  }, [nextCodeData]);

  // Mutations
  const createMutation = trpc.repairs.create.useMutation({
    onSuccess: () => {
      toast.success('Reparación registrada exitosamente');
      refetch();
      setDialogOpen(false);
      setPartesSeleccionadas([]);
      setBusquedaCliente('');
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

  const addPartsMutation = trpc.repairs.addParts.useMutation({
    onSuccess: () => {
      toast.success('Partes agregadas exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al agregar partes: ' + error.message);
    },
  });

  // Filtrar reparaciones por cliente
  const repairsFiltradas = useMemo(() => {
    let filtered = repairs;
    
    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(r => r.estado === filtroEstado);
    }
    
    // Filtrar por búsqueda de cliente
    if (busquedaCliente.trim()) {
      const search = busquedaCliente.toLowerCase();
      filtered = filtered.filter(r => 
        r.cliente?.toLowerCase().includes(search) ||
        r.telefono?.includes(search)
      );
    }
    
    return filtered;
  }, [repairs, filtroEstado, busquedaCliente]);

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

  // Agregar parte del inventario
  const handleAgregarParteInventario = (partId: number) => {
    const parte = parts.find(p => p.id === partId);
    if (!parte) return;

    const nuevaParte: ParteSeleccionada = {
      id: `inv-${Date.now()}-${Math.random()}`,
      partId: parte.id,
      esExterna: false,
      nombre: parte.nombre,
      cantidad: 1,
      costoUnitario: parte.precioCompraUnitario,
      cantidadDisponible: parte.cantidadActual,
    };

    setPartesSeleccionadas([...partesSeleccionadas, nuevaParte]);
  };

  // Agregar parte externa
  const handleAgregarParteExterna = () => {
    const nuevaParte: ParteSeleccionada = {
      id: `ext-${Date.now()}-${Math.random()}`,
      esExterna: true,
      nombre: '',
      cantidad: 1,
      costoUnitario: '0.00',
    };

    setPartesSeleccionadas([...partesSeleccionadas, nuevaParte]);
  };

  // Eliminar parte
  const handleEliminarParte = (id: string) => {
    setPartesSeleccionadas(partesSeleccionadas.filter(p => p.id !== id));
  };

  // Actualizar parte
  const handleActualizarParte = (id: string, campo: keyof ParteSeleccionada, valor: any) => {
    setPartesSeleccionadas(partesSeleccionadas.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  };

  // Calcular costo total de partes
  const costoTotalPartes = useMemo(() => {
    return partesSeleccionadas.reduce((sum, p) => 
      sum + (Number(p.costoUnitario) * p.cantidad), 0
    );
  }, [partesSeleccionadas]);

  // Calcular mano de obra automáticamente
  const manoDeObra = useMemo(() => {
    const mano = precioTotal - costoTotalPartes;
    return mano >= 0 ? mano : 0;
  }, [precioTotal, costoTotalPartes]);

  // Actualizar precio total cuando cambian las partes
  useEffect(() => {
    setPrecioTotal(costoTotalPartes + 50); // Sugerencia inicial: costo partes + $50 de mano de obra
  }, [costoTotalPartes]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validar partes
    for (const parte of partesSeleccionadas) {
      if (parte.esExterna && !parte.nombre.trim()) {
        toast.error('Todas las partes externas deben tener un nombre');
        return;
      }
      if (!parte.esExterna && parte.cantidadDisponible !== undefined && parte.cantidad > parte.cantidadDisponible) {
        toast.error(`Stock insuficiente para ${parte.nombre}. Disponible: ${parte.cantidadDisponible}`);
        return;
      }
    }

    // Preparar datos de partes para el backend
    const partesParaBackend = partesSeleccionadas.map(p => {
      const parte: any = {
        cantidad: p.cantidad,
      };
      
      if (p.esExterna) {
        parte.nombre = p.nombre;
        parte.costoUnitario = p.costoUnitario;
      } else {
        parte.partId = p.partId;
      }
      
      return parte;
    });

    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      cliente: formData.get('cliente') as string || undefined,
      telefono: formData.get('telefono') as string || undefined,
      dispositivo: formData.get('dispositivo') as string || undefined,
      problema: formData.get('problema') as string,
      diagnostico: formData.get('diagnostico') as string || undefined,
      precioManoObra: formData.get('precioManoObra') as string,
      precioTotal: formData.get('precioTotal') as string,
      fechaIngreso: formData.get('fechaIngreso') as string,
      notas: formData.get('notas') as string || undefined,
      partes: partesParaBackend.length > 0 ? partesParaBackend : undefined,
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
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setPartesSeleccionadas([]);
              setBusquedaCliente('');
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reparación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Reparación</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de la reparación y las partes utilizadas
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Código y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input 
                      id="codigo" 
                      name="codigo" 
                      defaultValue={siguienteCodigo}
                      placeholder="REP-001" 
                      required 
                      readOnly
                      className="bg-gray-50"
                    />
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

                {/* Cliente y Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input 
                      id="cliente" 
                      name="cliente" 
                      placeholder="Nombre del cliente" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input 
                      id="telefono" 
                      name="telefono" 
                      placeholder="555-1234" 
                    />
                  </div>
                </div>

                {/* Dispositivo */}
                <div>
                  <Label htmlFor="dispositivo">Dispositivo</Label>
                  <Input 
                    id="dispositivo" 
                    name="dispositivo" 
                    placeholder="iPhone 13 Pro" 
                  />
                </div>

                {/* Problema y Diagnóstico */}
                <div>
                  <Label htmlFor="problema">Problema Reportado *</Label>
                  <Textarea 
                    id="problema" 
                    name="problema" 
                    placeholder="Descripción del problema" 
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="diagnostico">Diagnóstico</Label>
                  <Textarea 
                    id="diagnostico" 
                    name="diagnostico" 
                    placeholder="Diagnóstico técnico" 
                  />
                </div>

                {/* Partes Utilizadas */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Partes Utilizadas</Label>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => handleAgregarParteInventario(Number(value))}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Del inventario" />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.map(part => (
                            <SelectItem key={part.id} value={part.id.toString()}>
                              {part.nombre} ({part.cantidadActual} disp.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleAgregarParteExterna}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Fuera de Inv.
                      </Button>
                    </div>
                  </div>

                  {/* Lista de partes seleccionadas */}
                  {partesSeleccionadas.length > 0 && (
                    <div className="space-y-2">
                      {partesSeleccionadas.map(parte => (
                        <div key={parte.id} className="flex items-center gap-2 p-2 border rounded">
                          {parte.esExterna ? (
                            <>
                              <Input
                                placeholder="Nombre de la parte"
                                value={parte.nombre}
                                onChange={(e) => handleActualizarParte(parte.id, 'nombre', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Costo"
                                value={parte.costoUnitario}
                                onChange={(e) => handleActualizarParte(parte.id, 'costoUnitario', e.target.value)}
                                className="w-24"
                              />
                            </>
                          ) : (
                            <>
                              <span className="flex-1">{parte.nombre}</span>
                              <span className="text-sm text-gray-500">
                                ${parte.costoUnitario} c/u
                              </span>
                            </>
                          )}
                          <Input
                            type="number"
                            min="1"
                            max={parte.cantidadDisponible}
                            value={parte.cantidad}
                            onChange={(e) => handleActualizarParte(parte.id, 'cantidad', Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm font-medium w-20 text-right">
                            ${(Number(parte.costoUnitario) * parte.cantidad).toFixed(2)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarParte(parte.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t">
                        <span className="font-semibold">
                          Costo Total Partes: ${costoTotalPartes.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Precios */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="precioTotal">Precio Total al Cliente *</Label>
                    <Input 
                      id="precioTotal" 
                      name="precioTotal" 
                      type="number" 
                      step="0.01" 
                      placeholder="100.00" 
                      value={precioTotal.toFixed(2)}
                      onChange={(e) => setPrecioTotal(parseFloat(e.target.value) || 0)}
                      required 
                    />
                  </div>
                  
                  {/* Mostrar cálculos automáticos */}
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Costo Total Partes:</span>
                      <span className="font-bold">${costoTotalPartes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Mano de Obra (calculada):</span>
                      <span className="font-bold text-green-600">
                        ${manoDeObra.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-semibold">Ganancia Total:</span>
                      <span className="font-bold text-blue-600">
                        ${manoDeObra.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Campo oculto para mano de obra (calculado automáticamente) */}
                  <input 
                    type="hidden" 
                    id="precioManoObra" 
                    name="precioManoObra" 
                    value={manoDeObra.toFixed(2)}
                  />
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea 
                    id="notas" 
                    name="notas" 
                    placeholder="Observaciones adicionales" 
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar Reparación'}
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
              <span className="text-sm font-medium text-yellow-700">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{totales.pendientes}</p>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">En Proceso</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{totales.enProceso}</p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{totales.completadas}</p>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Ganancia Total</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              ${totales.gananciaTotal.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre de cliente o teléfono..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroEstado} onValueChange={(value: any) => setFiltroEstado(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
                <SelectItem value="entregada">Entregadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Lista de Reparaciones */}
        <div className="space-y-4">
          {repairsFiltradas.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay reparaciones que mostrar</p>
            </Card>
          ) : (
            repairsFiltradas.map((repair) => (
              <Card key={repair.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">{repair.codigo}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadge(repair.estado)}`}>
                        {getEstadoTexto(repair.estado)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Cliente:</p>
                        <p className="font-medium">{repair.cliente || 'Sin nombre'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Teléfono:</p>
                        <p className="font-medium">{repair.telefono || 'Sin teléfono'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dispositivo:</p>
                        <p className="font-medium">{repair.dispositivo}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha de Ingreso:</p>
                        <p className="font-medium">
                          {new Date(repair.fechaIngreso).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Precio Total:</p>
                        <p className="font-medium text-green-600">${Number(repair.precioTotal).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ganancia:</p>
                        <p className="font-medium text-blue-600">${Number(repair.ganancia).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select 
                      value={repair.estado} 
                      onValueChange={(value) => handleUpdateEstado(repair.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="entregada">Entregada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReparacionSeleccionada(repair);
                        setFacturaDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Recibo
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(repair.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Factura */}
        <Dialog open={facturaDialogOpen} onOpenChange={setFacturaDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recibo de Reparación</DialogTitle>
            </DialogHeader>
            {reparacionSeleccionada && (
              <FacturaReparacion repair={reparacionSeleccionada} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
// Force rebuild Mon Feb  9 17:52:40 EST 2026
