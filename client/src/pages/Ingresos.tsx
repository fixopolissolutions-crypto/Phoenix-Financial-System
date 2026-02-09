import { useState, useMemo, useEffect } from 'react';
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
import { Plus, DollarSign, Calendar, Pencil, Trash2, Loader2, CalendarIcon, Smartphone, Package } from 'lucide-react';
import VenderTelefonoModal from '@/components/VenderTelefonoModal';
import VenderAccesorioModal from '@/components/VenderAccesorioModal';

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

export default function Ingresos() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<PaymentMethod>('efectivo');
  const [descripcion, setDescripcion] = useState('');
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
  
  // Estado para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
  // Estados para modales de venta
  const [venderTelefonoOpen, setVenderTelefonoOpen] = useState(false);
  const [venderAccesorioOpen, setVenderAccesorioOpen] = useState(false);

  const utils = trpc.useUtils();
  
  // Detectar cambio de día y actualizar automáticamente
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDate) {
        console.log('Nuevo día detectado en Ingresos:', newDate);
        setCurrentDate(newDate);
        utils.transactions.list.invalidate();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(checkMidnight);
  }, [currentDate, utils]);
  
  // Query para obtener ingresos del día actual
  const dateRange = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return {
      fechaInicio: startOfDay.toISOString(),
      fechaFin: endOfDay.toISOString(),
    };
  }, []);
  
  const { data: ingresos = [], isLoading } = trpc.transactions.list.useQuery({
    tipo: 'ingreso',
    tienda: user?.role as 'admin' | 'sucursal' | undefined,
    ...dateRange,
  });

  // Mutations
  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Ingreso registrado exitosamente');
      setMonto('');
      setDescripcion('');
      setMetodo('efectivo');
      const today = new Date();
      setFechaSeleccionada(today.toISOString().split('T')[0]);
    },
    onError: () => {
      toast.error('Error al registrar el ingreso');
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Ingreso actualizado exitosamente');
      setEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast.error('Error al actualizar el ingreso');
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Ingreso eliminado exitosamente');
      setDeleteDialogOpen(false);
      setDeletingTransaction(null);
    },
    onError: () => {
      toast.error('Error al eliminar el ingreso');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !monto || parseFloat(monto) <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    createMutation.mutate({
      tipo: 'ingreso',
      monto: monto,
      metodo,
      descripcion: descripcion || undefined,
      tienda: user.role as 'admin' | 'sucursal',
      fecha: fechaSeleccionada + 'T12:00:00.000Z',
    });
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditMonto(transaction.monto.toString());
    setEditMetodo(transaction.metodo);
    setEditDescripcion(transaction.descripcion || '');
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
  const totalEfectivo = ingresos
    .filter(i => i.metodo === 'efectivo')
    .reduce((sum, i) => sum + parseFloat(i.monto), 0);
  
  const totalBanco = ingresos
    .filter(i => i.metodo === 'banco')
    .reduce((sum, i) => sum + parseFloat(i.monto), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Ingreso</h1>
          <p className="text-muted-foreground mt-1">Registra los ingresos del día</p>
        </div>

        {/* Botones de venta rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setVenderTelefonoOpen(true)}
            className="h-20 text-lg"
            variant="outline"
          >
            <Smartphone className="mr-2 h-6 w-6" />
            Vender Teléfono
          </Button>
          <Button
            onClick={() => setVenderAccesorioOpen(true)}
            className="h-20 text-lg"
            variant="outline"
          >
            <Package className="mr-2 h-6 w-6" />
            Vender Accesorio
          </Button>
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
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del ingreso..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Ingreso
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Resumen */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <h3 className="font-semibold text-green-800 mb-4">Resumen del Día</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Total Efectivo:</span>
                  <span className="font-bold text-green-800">${totalEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Total Banco:</span>
                  <span className="font-bold text-green-800">${totalBanco.toFixed(2)}</span>
                </div>
                <div className="border-t border-green-300 pt-3 flex justify-between items-center">
                  <span className="text-green-700 font-semibold">Total General:</span>
                  <span className="font-bold text-xl text-green-800">${(totalEfectivo + totalBanco).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Lista de ingresos */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ingresos de Hoy ({ingresos.length})
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : ingresos.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay ingresos registrados hoy</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {ingresos.map((ingreso) => (
                    <div 
                      key={ingreso.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">+${parseFloat(ingreso.monto).toFixed(2)}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                            {ingreso.metodo}
                          </span>
                        </div>
                        {ingreso.descripcion && (
                          <p className="text-sm text-muted-foreground truncate">{ingreso.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(ingreso)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(ingreso)}
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
            <DialogTitle>Editar Ingreso</DialogTitle>
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
            ¿Estás seguro de que deseas eliminar este ingreso de ${deletingTransaction ? parseFloat(deletingTransaction.monto).toFixed(2) : '0.00'}?
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

      {/* Modales de venta */}
      <VenderTelefonoModal
        open={venderTelefonoOpen}
        onOpenChange={setVenderTelefonoOpen}
      />
      <VenderAccesorioModal
        open={venderAccesorioOpen}
        onOpenChange={setVenderAccesorioOpen}
      />
    </DashboardLayout>
  );
}
