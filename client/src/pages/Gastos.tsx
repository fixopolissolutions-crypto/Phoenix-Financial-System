import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Minus, DollarSign, Calendar, Pencil, Trash2, Loader2, CalendarIcon } from 'lucide-react';

type PaymentMethod = 'efectivo' | 'banco';

interface Transaction {
  id: number;
  tipo: 'ingreso' | 'gasto';
  monto: string;
  metodo: 'efectivo' | 'banco';
  descripcion: string | null;
  categoria: string | null;
  proveedor: string | null;
  tienda: 'admin' | 'sucursal';
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORIAS = [
  'Inventario',
  'Servicios',
  'Renta',
  'Salarios',
  'Marketing',
  'Mantenimiento',
  'Transporte',
  'Otros'
];

export default function Gastos() {
  const { user } = useAuth();
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<PaymentMethod>('efectivo');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Estados para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editMonto, setEditMonto] = useState('');
  const [editMetodo, setEditMetodo] = useState<PaymentMethod>('efectivo');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  
  // Estado para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const utils = trpc.useUtils();
  
  // Query para obtener gastos
  const { data: gastos = [], isLoading } = trpc.transactions.list.useQuery({
    tipo: 'gasto',
    tienda: user?.role as 'admin' | 'sucursal' | undefined,
  });

  // Query para obtener proveedores
  const { data: proveedores = [] } = trpc.providers.list.useQuery();

  // Mutations
  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Gasto registrado exitosamente');
      setMonto('');
      setDescripcion('');
      setMetodo('efectivo');
      setCategoria('');
      setProveedor('');
      const today = new Date();
      setFechaSeleccionada(today.toISOString().split('T')[0]);
    },
    onError: () => {
      toast.error('Error al registrar el gasto');
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Gasto actualizado exitosamente');
      setEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast.error('Error al actualizar el gasto');
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Gasto eliminado exitosamente');
      setDeleteDialogOpen(false);
      setDeletingTransaction(null);
    },
    onError: () => {
      toast.error('Error al eliminar el gasto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !monto || parseFloat(monto) <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    createMutation.mutate({
      tipo: 'gasto',
      monto: monto,
      metodo,
      descripcion: descripcion || undefined,
      categoria: categoria || undefined,
      proveedor: proveedor || undefined,
      tienda: user.role as 'admin' | 'sucursal',
      fecha: fechaSeleccionada + 'T12:00:00.000Z',
    });
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditMonto(transaction.monto.toString());
    setEditMetodo(transaction.metodo);
    setEditDescripcion(transaction.descripcion || '');
    setEditCategoria(transaction.categoria || '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingTransaction || !editMonto || parseFloat(editMonto) <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    updateMutation.mutate({
      id: editingTransaction.id,
      monto: editMonto,
      metodo: editMetodo,
      descripcion: editDescripcion || undefined,
      categoria: editCategoria || undefined,
    });
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingTransaction) return;
    deleteMutation.mutate({ id: deletingTransaction.id });
  };

  // Calcular totales
  const totalEfectivo = gastos
    .filter(g => g.metodo === 'efectivo')
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);
  
  const totalBanco = gastos
    .filter(g => g.metodo === 'banco')
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Gasto</h1>
          <p className="text-muted-foreground mt-1">Registra los gastos del día</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fecha"
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pago</Label>
                <Select value={metodo} onValueChange={(v) => setMetodo(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="banco">Banco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor (opcional)</Label>
                <Select value={proveedor} onValueChange={setProveedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin proveedor</SelectItem>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov.id} value={prov.nombre}>{prov.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del gasto..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" variant="destructive" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Minus className="mr-2 h-4 w-4" />
                    Registrar Gasto
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Resumen */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <h3 className="font-semibold text-red-800 mb-4">Resumen del Día</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-700">Total Efectivo:</span>
                  <span className="font-bold text-red-800">${totalEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-700">Total Banco:</span>
                  <span className="font-bold text-red-800">${totalBanco.toFixed(2)}</span>
                </div>
                <div className="border-t border-red-300 pt-3 flex justify-between items-center">
                  <span className="text-red-700 font-semibold">Total General:</span>
                  <span className="font-bold text-xl text-red-800">${(totalEfectivo + totalBanco).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Lista de gastos */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gastos de Hoy ({gastos.length})
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : gastos.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay gastos registrados hoy</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {gastos.map((gasto) => (
                    <div 
                      key={gasto.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">-${parseFloat(gasto.monto).toFixed(2)}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                            {gasto.metodo}
                          </span>
                          {gasto.categoria && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {gasto.categoria}
                            </span>
                          )}
                        </div>
                        {gasto.descripcion && (
                          <p className="text-sm text-muted-foreground truncate">{gasto.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(gasto)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(gasto)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editMonto}
                onChange={(e) => setEditMonto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={editMetodo} onValueChange={(v) => setEditMetodo(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={editCategoria} onValueChange={setEditCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            ¿Estás seguro de que deseas eliminar este gasto de ${deletingTransaction ? parseFloat(deletingTransaction.monto).toFixed(2) : '0.00'}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
