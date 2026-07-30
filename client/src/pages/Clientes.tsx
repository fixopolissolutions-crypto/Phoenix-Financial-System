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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import {
  Users, Plus, Search, Trash2, Edit2, Building2, User,
  Phone, Mail, MapPin, Tag, Star, TrendingUp, Wrench,
  DollarSign, X, ChevronRight, Percent
} from 'lucide-react';
import { toast } from 'sonner';

const FUENTES = [
  { value: 'walk_in', label: 'Visita directa (Walk-in)' },
  { value: 'referido', label: 'Referido por cliente' },
  { value: 'redes_sociales', label: 'Redes Sociales' },
  { value: 'google', label: 'Google / Búsqueda web' },
  { value: 'publicidad', label: 'Publicidad / Flyer' },
  { value: 'otro', label: 'Otro' },
];

const FUENTE_LABELS: Record<string, string> = {
  walk_in: 'Walk-in', referido: 'Referido', redes_sociales: 'Redes Sociales',
  google: 'Google', publicidad: 'Publicidad', otro: 'Otro',
};

const FUENTE_COLORS: Record<string, string> = {
  walk_in: 'bg-blue-100 text-blue-700',
  referido: 'bg-green-100 text-green-700',
  redes_sociales: 'bg-purple-100 text-purple-700',
  google: 'bg-orange-100 text-orange-700',
  publicidad: 'bg-yellow-100 text-yellow-700',
  otro: 'bg-gray-100 text-gray-600',
};

export default function Clientes() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'persona' | 'empresa'>('todos');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: customers = [], refetch } = trpc.customers.list.useQuery({ busqueda: busqueda || undefined });
  const { data: stats } = trpc.customers.getStats.useQuery(
    { id: selectedCustomer?.id ?? 0 },
    { enabled: !!selectedCustomer?.id }
  );

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => { toast.success('Cliente registrado'); refetch(); setDialogOpen(false); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success('Cliente actualizado'); refetch(); setDialogOpen(false); setEditingCustomer(null); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => { toast.success('Cliente eliminado'); refetch(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const customersFiltrados = useMemo(() => {
    let list = customers;
    if (filtroTipo === 'persona') list = list.filter(c => !c.esEmpresa);
    if (filtroTipo === 'empresa') list = list.filter(c => c.esEmpresa);
    return list;
  }, [customers, filtroTipo]);

  const totales = useMemo(() => ({
    total: customers.length,
    empresas: customers.filter(c => c.esEmpresa).length,
    conDescuento: customers.filter(c => Number(c.descuento) > 0).length,
  }), [customers]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      nombre: fd.get('nombre') as string,
      telefono: fd.get('telefono') as string || undefined,
      email: fd.get('email') as string || undefined,
      direccion: fd.get('direccion') as string || undefined,
      empresa: fd.get('empresa') as string || undefined,
      esEmpresa: fd.get('esEmpresa') === '1' ? 1 : 0,
      descuento: parseFloat(fd.get('descuento') as string) || 0,
      fuenteAdquisicion: fd.get('fuenteAdquisicion') as string || undefined,
      notas: fd.get('notas') as string || undefined,
    };
    if (!data.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (customer: any) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const openDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este cliente?')) deleteMutation.mutate({ id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Directorio y CRM de clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCustomer(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de cliente */}
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="esEmpresa" value="0" defaultChecked={!editingCustomer?.esEmpresa} className="accent-orange-500" />
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Persona</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="esEmpresa" value="1" defaultChecked={!!editingCustomer?.esEmpresa} className="accent-orange-500" />
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Empresa / B2B</span>
                  </label>
                </div>

                {/* Nombre y Empresa */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input id="nombre" name="nombre" defaultValue={editingCustomer?.nombre} placeholder="Juan Pérez" required />
                  </div>
                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input id="empresa" name="empresa" defaultValue={editingCustomer?.empresa} placeholder="Nombre de la empresa" />
                  </div>
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono" className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Teléfono</Label>
                    <Input id="telefono" name="telefono" defaultValue={editingCustomer?.telefono} placeholder="555-1234" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} placeholder="cliente@email.com" />
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <Label htmlFor="direccion" className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Dirección</Label>
                  <Input id="direccion" name="direccion" defaultValue={editingCustomer?.direccion} placeholder="Calle, número, colonia..." />
                </div>

                {/* Descuento y Fuente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="descuento" className="flex items-center gap-1"><Percent className="h-3.5 w-3.5" />Descuento Fijo (%)</Label>
                    <Input id="descuento" name="descuento" type="number" min="0" max="100" step="0.5"
                      defaultValue={editingCustomer?.descuento ?? 0} placeholder="0" />
                    <p className="text-xs text-gray-500 mt-1">Descuento automático en cada venta/reparación</p>
                  </div>
                  <div>
                    <Label htmlFor="fuenteAdquisicion" className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />¿Cómo nos conoció?</Label>
                    <select
                      id="fuenteAdquisicion"
                      name="fuenteAdquisicion"
                      defaultValue={editingCustomer?.fuenteAdquisicion || ''}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea id="notas" name="notas" defaultValue={editingCustomer?.notas} placeholder="Observaciones sobre el cliente..." />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : editingCustomer ? 'Actualizar' : 'Registrar Cliente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totales.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Empresas B2B</p>
                <p className="text-2xl font-bold text-purple-700">{totales.empresas}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Percent className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Con Descuento</p>
                <p className="text-2xl font-bold text-green-700">{totales.conDescuento}</p>
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
                placeholder="Buscar por nombre, teléfono, email o empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'persona', 'empresa'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtroTipo === tipo ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tipo === 'todos' ? 'Todos' : tipo === 'persona' ? 'Personas' : 'Empresas'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Lista de Clientes */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          {customersFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No hay clientes registrados</p>
              <p className="text-sm text-gray-400 mt-1">Agrega tu primer cliente con el botón "Nuevo Cliente"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fuente</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descuento</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customersFiltrados.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            customer.esEmpresa ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {customer.esEmpresa ? <Building2 className="h-4 w-4" /> : customer.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{customer.nombre}</p>
                            {customer.empresa && <p className="text-xs text-gray-500">{customer.empresa}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {customer.telefono && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />{customer.telefono}
                            </p>
                          )}
                          {customer.email && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />{customer.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {customer.fuenteAdquisicion ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${FUENTE_COLORS[customer.fuenteAdquisicion] || 'bg-gray-100 text-gray-600'}`}>
                            {FUENTE_LABELS[customer.fuenteAdquisicion] || customer.fuenteAdquisicion}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {Number(customer.descuento) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <Percent className="h-3 w-3" />{Number(customer.descuento).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(customer)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                            title="Ver detalle"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(customer)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Mostrando {customersFiltrados.length} de {customers.length} clientes
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Dialog de Detalle del Cliente */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCustomer?.esEmpresa ? <Building2 className="h-5 w-5 text-purple-600" /> : <User className="h-5 w-5 text-blue-600" />}
                {selectedCustomer?.nombre}
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                {/* Datos de contacto */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedCustomer.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.telefono}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.empresa && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.empresa}</span>
                    </div>
                  )}
                  {selectedCustomer.direccion && (
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{selectedCustomer.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Wrench className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{stats?.reparaciones ?? '—'}</p>
                    <p className="text-xs text-blue-600">Reparaciones</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">${(stats?.totalGastado ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-green-600">Total Gastado</p>
                  </div>
                </div>

                {/* Descuento y fuente */}
                <div className="flex items-center gap-3">
                  {Number(selectedCustomer.descuento) > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                      <Percent className="h-3.5 w-3.5" />{Number(selectedCustomer.descuento).toFixed(0)}% descuento fijo
                    </span>
                  )}
                  {selectedCustomer.fuenteAdquisicion && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${FUENTE_COLORS[selectedCustomer.fuenteAdquisicion] || 'bg-gray-100 text-gray-600'}`}>
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      {FUENTE_LABELS[selectedCustomer.fuenteAdquisicion] || selectedCustomer.fuenteAdquisicion}
                    </span>
                  )}
                </div>

                {selectedCustomer.notas && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">NOTAS</p>
                    <p className="text-sm text-gray-700">{selectedCustomer.notas}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setDetailOpen(false); openEdit(selectedCustomer); }}>
                    <Edit2 className="h-4 w-4 mr-2" />Editar
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setDetailOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
