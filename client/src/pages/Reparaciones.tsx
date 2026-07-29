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
import {
  Wrench, Plus, DollarSign, Clock, CheckCircle, Package, Trash2,
  FileText, Search, X, User, Phone, Smartphone, CalendarRange,
  CheckSquare, Eye, MoreVertical, Shield, ShieldOff, Printer, UserCog
} from 'lucide-react';
import { FacturaReparacion } from '@/components/FacturaReparacion';
import { toast } from 'sonner';

interface ParteSeleccionada {
  id: string;
  partId?: number;
  esExterna: boolean;
  nombre: string;
  cantidad: number;
  costoUnitario: string;
  cantidadDisponible?: number;
}

interface RepairSummary {
  codigo: string;
  cliente: string;
  dispositivo: string;
  precioTotal: number;
  manoDeObra: number;
}

// ─── Orden de Trabajo (ventana de impresión) ───────────────────────────────
function imprimirOrdenTrabajo(repair: any) {
  const garantiaVence = repair.garantiaVence
    ? new Date(repair.garantiaVence).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : repair.garantiaDias
      ? (() => {
          const d = new Date(repair.fechaIngreso);
          d.setDate(d.getDate() + (repair.garantiaDias || 30));
          return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        })()
      : 'N/A';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Orden de Trabajo ${repair.codigo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
    .header h2 { font-size: 13px; font-weight: 600; color: #555; }
    .badge { display: inline-block; background: #f97316; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 14px; font-weight: 700; margin-top: 6px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .section { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .label { color: #666; }
    .value { font-weight: 600; text-align: right; max-width: 60%; }
    .problem-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .problem-box p { margin-top: 4px; line-height: 1.5; }
    .garantia { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .garantia-title { color: #15803d; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .firma-line { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 11px; color: #555; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>FIXOPOLIS SOLUTIONS</h1>
    <h2>Orden de Trabajo — Reparación</h2>
    <div class="badge">${repair.codigo}</div>
  </div>

  <div class="grid2">
    <div class="section">
      <div class="section-title">Datos del Cliente</div>
      <div class="row"><span class="label">Nombre:</span><span class="value">${repair.cliente || '—'}</span></div>
      <div class="row"><span class="label">Teléfono:</span><span class="value">${repair.telefono || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Datos del Equipo</div>
      <div class="row"><span class="label">Dispositivo:</span><span class="value">${repair.dispositivo || '—'}</span></div>
      <div class="row"><span class="label">Fecha Ingreso:</span><span class="value">${new Date(repair.fechaIngreso).toLocaleDateString('es-MX')}</span></div>
      <div class="row"><span class="label">Técnico:</span><span class="value">${repair.tecnico || 'Sin asignar'}</span></div>
    </div>
  </div>

  <div class="problem-box">
    <div class="section-title">Problema Reportado</div>
    <p>${repair.problema || '—'}</p>
  </div>

  ${repair.diagnostico ? `
  <div class="problem-box">
    <div class="section-title">Diagnóstico Técnico</div>
    <p>${repair.diagnostico}</p>
  </div>` : ''}

  ${repair.notas ? `
  <div class="problem-box">
    <div class="section-title">Notas Adicionales</div>
    <p>${repair.notas}</p>
  </div>` : ''}

  <div class="grid2">
    <div class="section">
      <div class="section-title">Costos</div>
      <div class="row"><span class="label">Costo Partes:</span><span class="value">$${Number(repair.costoPartes || 0).toFixed(2)}</span></div>
      <div class="row"><span class="label">Mano de Obra:</span><span class="value">$${Number(repair.precioManoObra || 0).toFixed(2)}</span></div>
      <div class="row" style="border-top:1px solid #eee;padding-top:4px;margin-top:4px">
        <span class="label"><strong>Total:</strong></span>
        <span class="value"><strong>$${Number(repair.precioTotal || 0).toFixed(2)}</strong></span>
      </div>
    </div>
    <div class="garantia">
      <div class="garantia-title">🛡 Garantía</div>
      <div class="row" style="margin-top:6px"><span class="label">Días:</span><span class="value">${repair.garantiaDias || 30} días</span></div>
      <div class="row"><span class="label">Vence:</span><span class="value">${garantiaVence}</span></div>
      <p style="font-size:10px;color:#555;margin-top:6px">La garantía cubre el defecto reparado bajo uso normal. No aplica a daños por agua, golpes o mal uso.</p>
    </div>
  </div>

  <div class="firmas">
    <div class="firma-line">Firma del Técnico</div>
    <div class="firma-line">Firma del Cliente</div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function Reparaciones() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'completada' | 'entregada'>('todos');
  const [facturaDialogOpen, setFacturaDialogOpen] = useState(false);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [partesSeleccionadas, setPartesSeleccionadas] = useState<ParteSeleccionada[]>([]);
  const [siguienteCodigo, setSiguienteCodigo] = useState('REP-001');
  const [precioTotal, setPrecioTotal] = useState<number>(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [repairSummary, setRepairSummary] = useState<RepairSummary | null>(null);

  // Queries
  const { data: repairs = [], refetch } = trpc.repairs.list.useQuery();
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const { data: nextCodeData } = trpc.repairs.getNextCode.useQuery();

  useEffect(() => {
    if (nextCodeData?.codigo) {
      setSiguienteCodigo(nextCodeData.codigo);
    }
  }, [nextCodeData]);

  // Mutations
  const createMutation = trpc.repairs.create.useMutation({
    onSuccess: (result, variables) => {
      setRepairSummary({
        codigo: variables.codigo,
        cliente: variables.cliente || 'Sin nombre',
        dispositivo: variables.dispositivo || 'Sin dispositivo',
        precioTotal: parseFloat(variables.precioTotal),
        manoDeObra: parseFloat(variables.precioManoObra),
      });
      setSummaryOpen(true);
      refetch();
      setDialogOpen(false);
      resetForm();
      toast.success('Reparación registrada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al registrar reparación: ' + error.message);
    },
  });

  const updateMutation = trpc.repairs.update.useMutation({
    onSuccess: () => {
      toast.success('Reparación actualizada');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteMutation = trpc.repairs.delete.useMutation({
    onSuccess: () => {
      toast.success('Reparación eliminada');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const resetForm = () => {
    setPartesSeleccionadas([]);
    setPrecioTotal(0);
  };

  // Filtrar reparaciones
  const repairsFiltradas = useMemo(() => {
    let filtered = repairs;
    if (filtroEstado !== 'todos') filtered = filtered.filter(r => r.estado === filtroEstado);
    if (busqueda.trim()) {
      const search = busqueda.toLowerCase();
      filtered = filtered.filter(r =>
        r.cliente?.toLowerCase().includes(search) ||
        r.telefono?.includes(search) ||
        r.codigo?.toLowerCase().includes(search) ||
        r.dispositivo?.toLowerCase().includes(search) ||
        (r as any).tecnico?.toLowerCase().includes(search)
      );
    }
    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      filtered = filtered.filter(r => new Date(r.fechaIngreso) >= inicio);
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.fechaIngreso) <= fin);
    }
    return filtered;
  }, [repairs, filtroEstado, busqueda, fechaInicio, fechaFin]);

  // Calcular totales
  const totales = useMemo(() => {
    const pendientes = repairs.filter(r => r.estado === 'pendiente').length;
    const enProceso = repairs.filter(r => r.estado === 'en_proceso').length;
    const completadas = repairs.filter(r => r.estado === 'completada' || r.estado === 'entregada').length;
    const gananciaTotal = repairs
      .filter(r => r.estado === 'completada' || r.estado === 'entregada')
      .reduce((sum, r) => sum + Number(r.ganancia), 0);
    return { pendientes, enProceso, completadas, total: repairs.length, gananciaTotal };
  }, [repairs]);

  const handleAgregarParteInventario = (partId: number) => {
    const parte = parts.find(p => p.id === partId);
    if (!parte) return;
    setPartesSeleccionadas([...partesSeleccionadas, {
      id: `inv-${Date.now()}-${Math.random()}`,
      partId: parte.id,
      esExterna: false,
      nombre: parte.nombre,
      cantidad: 1,
      costoUnitario: parte.precioCompraUnitario,
      cantidadDisponible: parte.cantidadActual,
    }]);
  };

  const handleAgregarParteExterna = () => {
    setPartesSeleccionadas([...partesSeleccionadas, {
      id: `ext-${Date.now()}-${Math.random()}`,
      esExterna: true,
      nombre: '',
      cantidad: 1,
      costoUnitario: '0.00',
    }]);
  };

  const handleEliminarParte = (id: string) => {
    setPartesSeleccionadas(partesSeleccionadas.filter(p => p.id !== id));
  };

  const handleActualizarParte = (id: string, campo: keyof ParteSeleccionada, valor: any) => {
    setPartesSeleccionadas(partesSeleccionadas.map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  };

  const costoTotalPartes = useMemo(() =>
    partesSeleccionadas.reduce((sum, p) => sum + (Number(p.costoUnitario) * p.cantidad), 0),
    [partesSeleccionadas]
  );

  const manoDeObra = useMemo(() => {
    const mano = precioTotal - costoTotalPartes;
    return mano >= 0 ? mano : 0;
  }, [precioTotal, costoTotalPartes]);

  useEffect(() => {
    if (precioTotal < costoTotalPartes) setPrecioTotal(costoTotalPartes + 50);
  }, [costoTotalPartes]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clienteVal = formData.get('cliente') as string;
    const telefonoVal = formData.get('telefono') as string;
    const dispositivoVal = formData.get('dispositivo') as string;

    if (!clienteVal?.trim()) { toast.error('El nombre del cliente es requerido'); return; }
    if (!telefonoVal?.trim()) { toast.error('El teléfono del cliente es requerido'); return; }
    if (!dispositivoVal?.trim()) { toast.error('El modelo del dispositivo es requerido'); return; }

    for (const parte of partesSeleccionadas) {
      if (parte.esExterna && !parte.nombre.trim()) {
        toast.error('Todas las partes externas deben tener un nombre'); return;
      }
      if (!parte.esExterna && parte.cantidadDisponible !== undefined && parte.cantidad > parte.cantidadDisponible) {
        toast.error(`Stock insuficiente para ${parte.nombre}. Disponible: ${parte.cantidadDisponible}`); return;
      }
    }

    const partesParaBackend = partesSeleccionadas.map(p => {
      const parte: any = { cantidad: p.cantidad };
      if (p.esExterna) { parte.nombre = p.nombre; parte.costoUnitario = p.costoUnitario; }
      else { parte.partId = p.partId; }
      return parte;
    });

    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      cliente: clienteVal,
      telefono: telefonoVal,
      dispositivo: dispositivoVal,
      problema: formData.get('problema') as string,
      diagnostico: formData.get('diagnostico') as string || undefined,
      precioManoObra: manoDeObra.toFixed(2),
      precioTotal: precioTotal.toFixed(2),
      fechaIngreso: formData.get('fechaIngreso') as string,
      notas: formData.get('notas') as string || undefined,
      partes: partesParaBackend.length > 0 ? partesParaBackend : undefined,
    });
  };

  const handleUpdateEstado = (id: number, nuevoEstado: string) => {
    const updateData: any = { id, estado: nuevoEstado as any };
    if (nuevoEstado === 'completada') updateData.fechaCompletado = new Date().toISOString();
    else if (nuevoEstado === 'entregada') updateData.fechaEntrega = new Date().toISOString();
    updateMutation.mutate(updateData);
  };

  const handleUpdateTecnico = (id: number, tecnico: string) => {
    updateMutation.mutate({ id, tecnico });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta reparación?')) {
      deleteMutation.mutate({ id });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; dot: string; text: string }> = {
      pendiente:   { bg: 'bg-gray-100',   dot: 'bg-gray-400',   text: 'text-gray-700' },
      en_proceso:  { bg: 'bg-yellow-100', dot: 'bg-yellow-500', text: 'text-yellow-800' },
      completada:  { bg: 'bg-green-100',  dot: 'bg-green-500',  text: 'text-green-800' },
      entregada:   { bg: 'bg-blue-100',   dot: 'bg-blue-500',   text: 'text-blue-800' },
    };
    return badges[estado] || { bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'text-gray-700' };
  };

  const getEstadoTexto = (estado: string) => {
    const textos: Record<string, string> = {
      pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', entregada: 'Entregada',
    };
    return textos[estado] || estado;
  };

  // Calcular estado de garantía
  const getGarantiaStatus = (repair: any) => {
    if (!repair.garantiaVence && !repair.garantiaDias) return null;
    if (repair.estado !== 'entregada' && repair.estado !== 'completada') return null;
    let vence: Date;
    if (repair.garantiaVence) {
      vence = new Date(repair.garantiaVence);
    } else {
      vence = new Date(repair.fechaIngreso);
      vence.setDate(vence.getDate() + (repair.garantiaDias || 30));
    }
    const hoy = new Date();
    const activa = vence >= hoy;
    const diasRestantes = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return { activa, vence, diasRestantes };
  };

  const limpiarFiltros = () => {
    setBusqueda(''); setFiltroEstado('todos'); setFechaInicio(''); setFechaFin('');
  };

  const hayFiltrosActivos = busqueda || filtroEstado !== 'todos' || fechaInicio || fechaFin;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reparaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona las órdenes de reparación</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reparación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Reparación</DialogTitle>
                <DialogDescription>Ingresa los detalles de la reparación y las partes utilizadas</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Código y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" defaultValue={siguienteCodigo} readOnly className="bg-gray-50" required />
                  </div>
                  <div>
                    <Label htmlFor="fechaIngreso">Fecha de Ingreso *</Label>
                    <Input id="fechaIngreso" name="fechaIngreso" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>

                {/* Cliente y Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente" className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Cliente *</Label>
                    <Input id="cliente" name="cliente" placeholder="Nombre completo del cliente" required />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Teléfono *</Label>
                    <Input id="telefono" name="telefono" placeholder="555-1234" required />
                  </div>
                </div>

                {/* Dispositivo */}
                <div>
                  <Label htmlFor="dispositivo" className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" />Modelo del Dispositivo *</Label>
                  <Input id="dispositivo" name="dispositivo" placeholder="iPhone 13 Pro, Samsung Galaxy S22, etc." required />
                </div>

                {/* Técnico y Garantía */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tecnico" className="flex items-center gap-1"><UserCog className="h-3.5 w-3.5" />Técnico Asignado</Label>
                    <Input id="tecnico" name="tecnico" placeholder="Nombre del técnico" />
                  </div>
                  <div>
                    <Label htmlFor="garantiaDias" className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />Días de Garantía</Label>
                    <Input id="garantiaDias" name="garantiaDias" type="number" min="0" defaultValue="30" placeholder="30" />
                  </div>
                </div>

                {/* Problema y Diagnóstico */}
                <div>
                  <Label htmlFor="problema">Problema Reportado *</Label>
                  <Textarea id="problema" name="problema" placeholder="Descripción del problema" required />
                </div>
                <div>
                  <Label htmlFor="diagnostico">Diagnóstico</Label>
                  <Textarea id="diagnostico" name="diagnostico" placeholder="Diagnóstico técnico" />
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
                      <Button type="button" variant="outline" onClick={handleAgregarParteExterna}>
                        <Plus className="h-4 w-4 mr-2" />Fuera de Inv.
                      </Button>
                    </div>
                  </div>
                  {partesSeleccionadas.length > 0 && (
                    <div className="space-y-2">
                      {partesSeleccionadas.map(parte => (
                        <div key={parte.id} className="flex items-center gap-2 p-2 border rounded">
                          {parte.esExterna ? (
                            <>
                              <Input placeholder="Nombre de la parte" value={parte.nombre} onChange={(e) => handleActualizarParte(parte.id, 'nombre', e.target.value)} className="flex-1" />
                              <Input type="number" step="0.01" placeholder="Costo" value={parte.costoUnitario} onChange={(e) => handleActualizarParte(parte.id, 'costoUnitario', e.target.value)} className="w-24" />
                            </>
                          ) : (
                            <>
                              <span className="flex-1">{parte.nombre}</span>
                              <span className="text-sm text-gray-500">${parte.costoUnitario} c/u</span>
                            </>
                          )}
                          <Input type="number" min="1" max={parte.cantidadDisponible} value={parte.cantidad} onChange={(e) => handleActualizarParte(parte.id, 'cantidad', Number(e.target.value))} className="w-20" />
                          <span className="text-sm font-medium w-20 text-right">${(Number(parte.costoUnitario) * parte.cantidad).toFixed(2)}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleEliminarParte(parte.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2 border-t">
                        <span className="font-semibold">Costo Total Partes: ${costoTotalPartes.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Precios */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="precioTotal">Precio Total al Cliente *</Label>
                    <Input id="precioTotal" name="precioTotal" type="number" step="0.01" placeholder="100.00" value={precioTotal.toFixed(2)} onChange={(e) => setPrecioTotal(parseFloat(e.target.value) || 0)} required />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Costo Total Partes:</span>
                      <span className="font-bold">${costoTotalPartes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Mano de Obra (calculada):</span>
                      <span className="font-bold text-green-600">${manoDeObra.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-semibold">Ganancia Total:</span>
                      <span className="font-bold text-blue-600">${manoDeObra.toFixed(2)}</span>
                    </div>
                  </div>
                  <input type="hidden" id="precioManoObra" name="precioManoObra" value={manoDeObra.toFixed(2)} />
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea id="notas" name="notas" placeholder="Observaciones adicionales" />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar Reparación'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarjeta Resumen post-creación */}
        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckSquare className="h-5 w-5" />
                Reparación Registrada
              </DialogTitle>
            </DialogHeader>
            {repairSummary && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-green-200 pb-2">
                    <span className="text-sm text-gray-600">Código:</span>
                    <span className="font-bold text-lg text-green-700">{repairSummary.codigo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><User className="h-3.5 w-3.5" /> Cliente:</span>
                    <span className="font-medium">{repairSummary.cliente}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Dispositivo:</span>
                    <span className="font-medium">{repairSummary.dispositivo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Precio Total:</span>
                    <span className="font-bold text-green-700">${repairSummary.precioTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> Mano de Obra:</span>
                    <span className="font-bold text-blue-600">${repairSummary.manoDeObra.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setSummaryOpen(false)}>Cerrar</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{totales.pendientes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">En Proceso</p>
                <p className="text-2xl font-bold text-yellow-700">{totales.enProceso}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completadas</p>
                <p className="text-2xl font-bold text-green-700">{totales.completadas}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ganancia Total</p>
                <p className="text-2xl font-bold text-orange-700">${totales.gananciaTotal.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4 border-0 shadow-sm bg-white">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, teléfono, código, dispositivo o técnico..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 h-9 bg-gray-50 border-gray-200"
              />
            </div>
            <Select value={filtroEstado} onValueChange={(value: any) => setFiltroEstado(value)}>
              <SelectTrigger className="w-[180px] h-9 bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="entregada">Entregada</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9 bg-gray-50 border-gray-200 w-36" />
              <span className="text-gray-400 text-sm">—</span>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9 bg-gray-50 border-gray-200 w-36" />
            </div>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <X className="h-3.5 w-3.5" />Limpiar
              </button>
            )}
          </div>
        </Card>

        {/* Tabla de Reparaciones */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          {repairsFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay reparaciones que mostrar</p>
              <p className="text-gray-400 text-sm mt-1">Ajusta los filtros o crea una nueva reparación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dispositivo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Técnico</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Garantía</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repairsFiltradas.map((repair) => {
                    const badge = getEstadoBadge(repair.estado);
                    const garantia = getGarantiaStatus(repair);
                    return (
                      <tr key={repair.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-orange-600 text-sm">{repair.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{repair.cliente || 'Sin nombre'}</p>
                            <p className="text-xs text-gray-400">{repair.telefono || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-700">{repair.dispositivo || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(repair as any).tecnico ? (
                            <span className="text-sm text-gray-700 flex items-center gap-1">
                              <UserCog className="h-3.5 w-3.5 text-gray-400" />
                              {(repair as any).tecnico}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Select value={repair.estado} onValueChange={(value) => handleUpdateEstado(repair.id, value)}>
                            <SelectTrigger className="w-auto h-7 border-0 p-0 bg-transparent focus:ring-0">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                {getEstadoTexto(repair.estado)}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_proceso">En Proceso</SelectItem>
                              <SelectItem value="completada">Completada</SelectItem>
                              <SelectItem value="entregada">Entregada</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {garantia ? (
                            garantia.activa ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Shield className="h-3 w-3" />
                                {garantia.diasRestantes}d
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                <ShieldOff className="h-3 w-3" />
                                Vencida
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div>
                            <p className="text-sm font-bold text-gray-900">${Number(repair.precioTotal).toFixed(2)}</p>
                            <p className="text-xs text-green-600">+${Number(repair.ganancia).toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Orden de Trabajo */}
                            <button
                              onClick={() => imprimirOrdenTrabajo(repair)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"
                              title="Imprimir orden de trabajo"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            {/* Recibo/Factura */}
                            <button
                              onClick={() => { setReparacionSeleccionada(repair); setFacturaDialogOpen(true); }}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                              title="Ver recibo"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            {/* Eliminar */}
                            <button
                              onClick={() => handleDelete(repair.id)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Mostrando {repairsFiltradas.length} de {repairs.length} reparaciones
                </p>
              </div>
            </div>
          )}
        </Card>

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
