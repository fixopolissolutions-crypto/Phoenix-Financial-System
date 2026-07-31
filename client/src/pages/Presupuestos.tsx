import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import {
  FileText, Plus, Search, Send, CheckCircle, XCircle, Clock,
  Trash2, Eye, DollarSign, Smartphone, User, Phone, Mail,
  ChevronRight, Copy, ExternalLink, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface ItemPresupuesto {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

interface PresupuestoForm {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  dispositivoMarca: string;
  dispositivoModelo: string;
  descripcionProblema: string;
  notas: string;
  validoHasta: string;
  items: ItemPresupuesto[];
}

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  borrador:  { label: 'Borrador',  bg: 'bg-gray-100',   text: 'text-gray-700',  dot: 'bg-gray-400' },
  enviado:   { label: 'Enviado',   bg: 'bg-blue-100',   text: 'text-blue-700',  dot: 'bg-blue-500' },
  aprobado:  { label: 'Aprobado',  bg: 'bg-green-100',  text: 'text-green-700', dot: 'bg-green-500' },
  rechazado: { label: 'Rechazado', bg: 'bg-red-100',    text: 'text-red-700',   dot: 'bg-red-500' },
  expirado:  { label: 'Expirado',  bg: 'bg-orange-100', text: 'text-orange-700',dot: 'bg-orange-500' },
};

function generarCodigo() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `COT-${año}${mes}-${rand}`;
}

function generarToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function Presupuestos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vistaOpen, setVistaOpen] = useState(false);
  const [presupuestoVista, setPresupuestoVista] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const [form, setForm] = useState<PresupuestoForm>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    dispositivoMarca: '',
    dispositivoModelo: '',
    descripcionProblema: '',
    notas: '',
    validoHasta: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    items: [{ id: '1', descripcion: '', cantidad: 1, precioUnitario: 0 }],
  });

  // Queries y mutations
  const { data: presupuestos = [], refetch } = trpc.presupuestos.list.useQuery();

  const createMutation = trpc.presupuestos.create.useMutation({
    onSuccess: () => {
      toast.success('Presupuesto creado exitosamente');
      setDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const updateEstadoMutation = trpc.presupuestos.updateEstado.useMutation({
    onSuccess: () => {
      toast.success('Estado actualizado');
      refetch();
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const deleteMutation = trpc.presupuestos.delete.useMutation({
    onSuccess: () => {
      toast.success('Presupuesto eliminado');
      refetch();
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const resetForm = () => {
    setForm({
      clienteNombre: '',
      clienteTelefono: '',
      clienteEmail: '',
      dispositivoMarca: '',
      dispositivoModelo: '',
      descripcionProblema: '',
      notas: '',
      validoHasta: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      })(),
      items: [{ id: '1', descripcion: '', cantidad: 1, precioUnitario: 0 }],
    });
  };

  // Cálculos
  const totales = useMemo(() => {
    const subtotal = form.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
    const impuesto = subtotal * 0.0825;
    return { subtotal, impuesto, total: subtotal + impuesto };
  }, [form.items]);

  const agregarItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), descripcion: '', cantidad: 1, precioUnitario: 0 }],
    }));
  };

  const eliminarItem = (id: string) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const actualizarItem = (id: string, campo: keyof ItemPresupuesto, valor: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [campo]: valor } : i),
    }));
  };

  const handleGuardar = (enviar: boolean) => {
    if (!form.clienteNombre.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }
    if (form.items.every(i => !i.descripcion.trim())) {
      toast.error('Agrega al menos un ítem al presupuesto');
      return;
    }

    const token = generarToken();
    createMutation.mutate({
      codigo: generarCodigo(),
      clienteNombre: form.clienteNombre,
      clienteTelefono: form.clienteTelefono,
      clienteEmail: form.clienteEmail,
      dispositivoMarca: form.dispositivoMarca,
      dispositivoModelo: form.dispositivoModelo,
      descripcionProblema: form.descripcionProblema,
      items: JSON.stringify(form.items),
      subtotal: totales.subtotal.toFixed(2),
      impuesto: totales.impuesto.toFixed(2),
      total: totales.total.toFixed(2),
      estado: enviar ? 'enviado' : 'borrador',
      notas: form.notas,
      validoHasta: form.validoHasta,
      tokenAprobacion: token,
    });
  };

  const copiarEnlace = (token: string) => {
    const url = `${window.location.origin}/cotizacion/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  // Filtros
  const presupuestosFiltrados = useMemo(() => {
    return (presupuestos as any[]).filter((p: any) => {
      const matchBusqueda = !busqueda || [p.codigo, p.clienteNombre, p.dispositivoMarca, p.dispositivoModelo]
        .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()));
      const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }, [presupuestos, busqueda, filtroEstado]);

  const stats = useMemo(() => ({
    total: (presupuestos as any[]).length,
    aprobados: (presupuestos as any[]).filter((p: any) => p.estado === 'aprobado').length,
    pendientes: (presupuestos as any[]).filter((p: any) => p.estado === 'enviado').length,
    valorTotal: (presupuestos as any[])
      .filter((p: any) => p.estado === 'aprobado')
      .reduce((s: number, p: any) => s + parseFloat(p.total || '0'), 0),
  }), [presupuestos]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cotizaciones para clientes con enlace de aprobación</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Presupuesto
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: FileText, color: 'bg-gray-100 text-gray-600' },
            { label: 'Enviados', value: stats.pendientes, icon: Send, color: 'bg-blue-100 text-blue-600' },
            { label: 'Aprobados', value: stats.aprobados, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
            { label: 'Valor Aprobado', value: `$${stats.valorTotal.toFixed(0)}`, icon: DollarSign, color: 'bg-orange-100 text-orange-600' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-4 border-0 shadow-sm bg-white">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, cliente, dispositivo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['todos', 'borrador', 'enviado', 'aprobado', 'rechazado', 'expirado'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtroEstado === estado
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {estado === 'todos' ? 'Todos' : ESTADO_CONFIG[estado]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de presupuestos */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {presupuestosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Sin presupuestos</p>
              <p className="text-sm text-gray-400">Crea tu primer presupuesto para un cliente</p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Presupuesto
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {presupuestosFiltrados.map((p: any) => {
                const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.borrador;
                let items: ItemPresupuesto[] = [];
                try { items = JSON.parse(p.items || '[]'); } catch {}
                return (
                  <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{p.codigo}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            {p.clienteNombre || 'Sin nombre'}
                          </div>
                          {p.clienteTelefono && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {p.clienteTelefono}
                            </div>
                          )}
                          {(p.dispositivoMarca || p.dispositivoModelo) && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Smartphone className="w-3 h-3" />
                              {[p.dispositivoMarca, p.dispositivoModelo].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {items.length} ítem{items.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            Total: ${parseFloat(p.total || '0').toFixed(2)}
                          </span>
                          {p.validoHasta && (
                            <span className="text-xs text-gray-400">
                              Válido hasta: {new Date(p.validoHasta).toLocaleDateString('es-MX')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Copiar enlace */}
                        {p.tokenAprobacion && p.estado !== 'aprobado' && p.estado !== 'rechazado' && (
                          <button
                            onClick={() => copiarEnlace(p.tokenAprobacion)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Copiar enlace de aprobación"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {/* Ver detalle */}
                        <button
                          onClick={() => { setPresupuestoVista(p); setVistaOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Marcar como enviado */}
                        {p.estado === 'borrador' && (
                          <button
                            onClick={() => updateEstadoMutation.mutate({ id: p.id, estado: 'enviado' })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Marcar como enviado"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {/* Eliminar */}
                        <button
                          onClick={() => { if (confirm('¿Eliminar este presupuesto?')) deleteMutation.mutate({ id: p.id }); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ─── Dialog Nuevo Presupuesto ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Nuevo Presupuesto
            </DialogTitle>
            <DialogDescription>
              Crea una cotización para el cliente. Podrá aprobarla desde su teléfono.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Datos del cliente */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Nombre *</Label>
                  <Input
                    value={form.clienteNombre}
                    onChange={e => setForm(prev => ({ ...prev, clienteNombre: e.target.value }))}
                    placeholder="Juan García"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Teléfono</Label>
                  <Input
                    value={form.clienteTelefono}
                    onChange={e => setForm(prev => ({ ...prev, clienteTelefono: e.target.value }))}
                    placeholder="512-555-0000"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-gray-600">Email</Label>
                  <Input
                    value={form.clienteEmail}
                    onChange={e => setForm(prev => ({ ...prev, clienteEmail: e.target.value }))}
                    placeholder="cliente@email.com"
                    className="mt-1"
                    type="email"
                  />
                </div>
              </div>
            </div>

            {/* Dispositivo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                Dispositivo
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Marca</Label>
                  <Input
                    value={form.dispositivoMarca}
                    onChange={e => setForm(prev => ({ ...prev, dispositivoMarca: e.target.value }))}
                    placeholder="Apple, Samsung..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Modelo</Label>
                  <Input
                    value={form.dispositivoModelo}
                    onChange={e => setForm(prev => ({ ...prev, dispositivoModelo: e.target.value }))}
                    placeholder="iPhone 15, Galaxy S24..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs text-gray-600">Descripción del Problema</Label>
                <Textarea
                  value={form.descripcionProblema}
                  onChange={e => setForm(prev => ({ ...prev, descripcionProblema: e.target.value }))}
                  placeholder="Pantalla rota, no enciende..."
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Ítems del presupuesto */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  Ítems del Presupuesto
                </h3>
                <button
                  type="button"
                  onClick={agregarItem}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar ítem
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      {idx === 0 && <Label className="text-xs text-gray-500 mb-1 block">Descripción</Label>}
                      <Input
                        value={item.descripcion}
                        onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                        placeholder="Pantalla LCD, Mano de obra..."
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs text-gray-500 mb-1 block">Cant.</Label>}
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={e => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                        className="text-sm text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      {idx === 0 && <Label className="text-xs text-gray-500 mb-1 block">Precio Unit.</Label>}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={e => actualizarItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="pl-6 text-sm"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end justify-between gap-1">
                      {idx === 0 && <Label className="text-xs text-gray-500 mb-1 block w-full text-right">Total</Label>}
                      <div className={`flex items-center justify-between w-full ${idx > 0 ? '' : ''}`}>
                        <span className="text-sm font-medium text-gray-700 ml-1">
                          ${(item.cantidad * item.precioUnitario).toFixed(2)}
                        </span>
                        {form.items.length > 1 && (
                          <button onClick={() => eliminarItem(item.id)} className="text-red-400 hover:text-red-600">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuesto (8.25%)</span>
                  <span className="font-medium">${totales.impuesto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-orange-600">${totales.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notas y validez */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Válido hasta</Label>
                <Input
                  type="date"
                  value={form.validoHasta}
                  onChange={e => setForm(prev => ({ ...prev, validoHasta: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Notas adicionales</Label>
                <Input
                  value={form.notas}
                  onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Incluye garantía de 30 días..."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleGuardar(false)}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                Guardar como Borrador
              </Button>
              <Button
                onClick={() => handleGuardar(true)}
                disabled={createMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                Guardar y Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog Vista de Presupuesto ─── */}
      <Dialog open={vistaOpen} onOpenChange={setVistaOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              {presupuestoVista?.codigo}
            </DialogTitle>
          </DialogHeader>
          {presupuestoVista && (
            <div className="space-y-4 py-2">
              {/* Estado */}
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = ESTADO_CONFIG[presupuestoVista.estado] || ESTADO_CONFIG.borrador;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Cliente y dispositivo */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{presupuestoVista.clienteNombre}</span>
                </div>
                {presupuestoVista.clienteTelefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {presupuestoVista.clienteTelefono}
                  </div>
                )}
                {presupuestoVista.clienteEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {presupuestoVista.clienteEmail}
                  </div>
                )}
                {(presupuestoVista.dispositivoMarca || presupuestoVista.dispositivoModelo) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    {[presupuestoVista.dispositivoMarca, presupuestoVista.dispositivoModelo].filter(Boolean).join(' ')}
                  </div>
                )}
              </div>

              {/* Ítems */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Ítems</h4>
                <div className="space-y-1.5">
                  {(() => {
                    let items: ItemPresupuesto[] = [];
                    try { items = JSON.parse(presupuestoVista.items || '[]'); } catch {}
                    return items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-gray-700">{item.descripcion} × {item.cantidad}</span>
                        <span className="font-medium">${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${parseFloat(presupuestoVista.subtotal || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Impuesto</span>
                    <span>${parseFloat(presupuestoVista.impuesto || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-orange-600">${parseFloat(presupuestoVista.total || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Enlace de aprobación */}
              {presupuestoVista.tokenAprobacion && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Enlace de Aprobación del Cliente
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-blue-600 bg-white rounded px-2 py-1 flex-1 truncate border border-blue-100">
                      {window.location.origin}/cotizacion/{presupuestoVista.tokenAprobacion}
                    </code>
                    <button
                      onClick={() => copiarEnlace(presupuestoVista.tokenAprobacion)}
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-blue-500 mt-2">
                    Comparte este enlace con el cliente para que pueda aprobar o rechazar la cotización.
                  </p>
                </div>
              )}

              {/* Acciones de estado */}
              {presupuestoVista.estado === 'enviado' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      updateEstadoMutation.mutate({ id: presupuestoVista.id, estado: 'aprobado' });
                      setVistaOpen(false);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Aprobado
                  </Button>
                  <Button
                    onClick={() => {
                      updateEstadoMutation.mutate({ id: presupuestoVista.id, estado: 'rechazado' });
                      setVistaOpen(false);
                    }}
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50 gap-2"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Marcar Rechazado
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
