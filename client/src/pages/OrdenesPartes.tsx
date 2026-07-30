import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Package, Plus, Truck, Clock, CheckCircle, AlertCircle, X,
  Edit2, Trash2, Search, Filter, Calendar, DollarSign, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

const ESTADOS = [
  { value: 'pendiente',  label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'ordenado',   label: 'Ordenado',    color: 'bg-blue-100 text-blue-700',    icon: Package },
  { value: 'en_camino',  label: 'En Camino',   color: 'bg-orange-100 text-orange-700', icon: Truck },
  { value: 'recibido',   label: 'Recibido',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  { value: 'cancelado',  label: 'Cancelado',   color: 'bg-red-100 text-red-700',      icon: X },
];

const ESTADO_MAP: Record<string, typeof ESTADOS[0]> = Object.fromEntries(ESTADOS.map(e => [e.value, e]));

function formatDate(d: any) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdenesPartes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Form state
  const [form, setForm] = useState({
    proveedor: '', descripcion: '', cantidad: 1,
    precioUnitario: '', fechaOrden: new Date().toISOString().split('T')[0],
    fechaEstimada: '', repairCodigo: '', notas: '',
  });

  const { data: orders = [], refetch } = trpc.partOrders.list.useQuery(
    filtroEstado !== 'todos' ? { estado: filtroEstado } : undefined
  );

  const createMutation = trpc.partOrders.create.useMutation({
    onSuccess: () => { toast.success('Orden creada'); refetch(); setDialogOpen(false); resetForm(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const updateMutation = trpc.partOrders.update.useMutation({
    onSuccess: () => { toast.success('Orden actualizada'); refetch(); setDialogOpen(false); setEditingOrder(null); resetForm(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const deleteMutation = trpc.partOrders.delete.useMutation({
    onSuccess: () => { toast.success('Orden eliminada'); refetch(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const resetForm = () => setForm({
    proveedor: '', descripcion: '', cantidad: 1,
    precioUnitario: '', fechaOrden: new Date().toISOString().split('T')[0],
    fechaEstimada: '', repairCodigo: '', notas: '',
  });

  const openEdit = (order: any) => {
    setEditingOrder(order);
    setForm({
      proveedor: order.proveedor || '',
      descripcion: order.descripcion || '',
      cantidad: order.cantidad || 1,
      precioUnitario: order.precioUnitario ? String(order.precioUnitario) : '',
      fechaOrden: order.fechaOrden ? order.fechaOrden.split('T')[0] : new Date().toISOString().split('T')[0],
      fechaEstimada: order.fechaEstimada ? order.fechaEstimada.split('T')[0] : '',
      repairCodigo: order.repairCodigo || '',
      notas: order.notas || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.proveedor.trim() || !form.descripcion.trim()) {
      toast.error('Proveedor y descripción son requeridos');
      return;
    }
    const precioU = parseFloat(form.precioUnitario) || undefined;
    const data = {
      proveedor: form.proveedor,
      descripcion: form.descripcion,
      cantidad: Number(form.cantidad),
      precioUnitario: precioU,
      precioTotal: precioU ? precioU * Number(form.cantidad) : undefined,
      fechaOrden: form.fechaOrden,
      fechaEstimada: form.fechaEstimada || undefined,
      repairCodigo: form.repairCodigo || undefined,
      notas: form.notas || undefined,
    };
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const changeStatus = (id: number, estado: string) => {
    const extra: any = {};
    if (estado === 'recibido') extra.fechaRecibido = new Date().toISOString().split('T')[0];
    updateMutation.mutate({ id, estado, ...extra });
  };

  const filtered = orders.filter((o: any) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (o.codigo?.toLowerCase().includes(q) || o.proveedor?.toLowerCase().includes(q) || o.descripcion?.toLowerCase().includes(q) || o.repairCodigo?.toLowerCase().includes(q));
  });

  // Estadísticas
  const stats = {
    total: orders.length,
    pendientes: orders.filter((o: any) => o.estado === 'pendiente').length,
    enCamino: orders.filter((o: any) => o.estado === 'en_camino').length,
    recibidos: orders.filter((o: any) => o.estado === 'recibido').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-7 w-7 text-orange-500" />
              Órdenes de Partes
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Pedidos especiales a proveedores para reparaciones</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingOrder(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="h-4 w-4" /> Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Editar Orden' : 'Nueva Orden de Parte'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Proveedor *</Label>
                    <Input value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} placeholder="Nombre del proveedor" />
                  </div>
                  <div className="col-span-2">
                    <Label>Descripción de la parte *</Label>
                    <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Pantalla LCD iPhone 13 Pro Max (OLED)" rows={2} />
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div>
                    <Label>Precio unitario ($)</Label>
                    <Input type="number" step="0.01" value={form.precioUnitario} onChange={e => setForm(f => ({ ...f, precioUnitario: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Fecha de orden *</Label>
                    <Input type="date" value={form.fechaOrden} onChange={e => setForm(f => ({ ...f, fechaOrden: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Fecha estimada de llegada</Label>
                    <Input type="date" value={form.fechaEstimada} onChange={e => setForm(f => ({ ...f, fechaEstimada: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Código de reparación vinculada</Label>
                    <Input value={form.repairCodigo} onChange={e => setForm(f => ({ ...f, repairCodigo: e.target.value.toUpperCase() }))} placeholder="Ej: ADM-001 (opcional)" />
                  </div>
                  <div className="col-span-2">
                    <Label>Notas</Label>
                    <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Notas adicionales..." rows={2} />
                  </div>
                </div>
                {form.precioUnitario && Number(form.precioUnitario) > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3 text-sm">
                    <span className="text-gray-600">Total estimado: </span>
                    <span className="font-bold text-orange-600">${(Number(form.precioUnitario) * form.cantidad).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" disabled={createMutation.isLoading || updateMutation.isLoading}>
                    {editingOrder ? 'Guardar Cambios' : 'Crear Orden'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: Package, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'En Camino', value: stats.enCamino, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Recibidos', value: stats.recibidos, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <Card key={s.label} className={`${s.bg} border-0 p-4 flex items-center gap-3`}>
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Buscar por código, proveedor, descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Lista de órdenes */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay órdenes de partes</p>
              <p className="text-sm text-gray-400 mt-1">Crea una nueva orden para registrar un pedido a proveedor</p>
            </Card>
          ) : (
            filtered.map((order: any) => {
              const estadoInfo = ESTADO_MAP[order.estado] || ESTADO_MAP['pendiente'];
              const Icon = estadoInfo.icon;
              const vencida = order.fechaEstimada && order.estado !== 'recibido' && order.estado !== 'cancelado' && new Date(order.fechaEstimada) < new Date();
              return (
                <Card key={order.id} className={`p-4 ${vencida ? 'border-red-200 bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Estado */}
                    <div className="flex-shrink-0 pt-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {estadoInfo.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{order.codigo}</span>
                        {order.repairCodigo && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Wrench className="h-3 w-3" />{order.repairCodigo}
                          </span>
                        )}
                        {vencida && <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="h-3 w-3" />Retrasada</span>}
                      </div>
                      <p className="font-semibold text-gray-900 mt-1">{order.descripcion}</p>
                      <p className="text-sm text-gray-500">{order.proveedor} · Cant: {order.cantidad}</p>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />Orden: {formatDate(order.fechaOrden)}</span>
                        {order.fechaEstimada && <span className={`text-xs flex items-center gap-1 ${vencida ? 'text-red-500' : 'text-gray-400'}`}><Truck className="h-3 w-3" />Estimado: {formatDate(order.fechaEstimada)}</span>}
                        {order.fechaRecibido && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Recibido: {formatDate(order.fechaRecibido)}</span>}
                      </div>
                      {order.notas && <p className="text-xs text-gray-400 mt-1 italic">{order.notas}</p>}
                    </div>

                    {/* Precio y acciones */}
                    <div className="flex-shrink-0 text-right space-y-2">
                      {order.precioTotal && (
                        <p className="font-bold text-gray-900 flex items-center gap-1 justify-end">
                          <DollarSign className="h-4 w-4 text-green-500" />${parseFloat(order.precioTotal).toFixed(2)}
                        </p>
                      )}
                      {/* Cambio de estado rápido */}
                      <Select value={order.estado} onValueChange={(v) => changeStatus(order.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(order)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Eliminar esta orden?')) deleteMutation.mutate({ id: order.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
