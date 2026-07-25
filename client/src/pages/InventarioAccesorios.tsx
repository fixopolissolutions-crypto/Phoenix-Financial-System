import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Headphones, Plus, DollarSign, Package, Trash2, AlertCircle, ShoppingCart, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function InventarioAccesorios() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<any>(null);

  // Queries
  const { data: accessories = [], refetch } = trpc.inventoryAccessories.list.useQuery({ activo: 1 });

  // Mutations
  const createMutation = trpc.inventoryAccessories.create.useMutation({
    onSuccess: () => {
      toast.success('Accesorio agregado exitosamente');
      refetch();
      setDialogOpen(false);
      setFormKey(prev => prev + 1);
    },
    onError: (error) => {
      toast.error('Error al agregar accesorio: ' + error.message);
    },
  });

  const updateMutation = trpc.inventoryAccessories.update.useMutation({
    onSuccess: () => {
      toast.success('Accesorio actualizado exitosamente');
      refetch();
      setEditDialogOpen(false);
      setSelectedAccessory(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar accesorio: ' + error.message);
    },
  });

  const sellMutation = trpc.inventoryAccessories.sell.useMutation({
    onSuccess: () => {
      toast.success('Venta registrada exitosamente');
      refetch();
      setSellDialogOpen(false);
      setSelectedAccessory(null);
    },
    onError: (error) => {
      toast.error('Error al registrar venta: ' + error.message);
    },
  });

  const addStockMutation = trpc.inventoryAccessories.addStock.useMutation({
    onSuccess: () => {
      toast.success('Stock agregado exitosamente');
      refetch();
      setAddStockDialogOpen(false);
      setSelectedAccessory(null);
    },
    onError: (error) => {
      toast.error('Error al agregar stock: ' + error.message);
    },
  });

  const deleteMutation = trpc.inventoryAccessories.delete.useMutation({
    onSuccess: () => {
      toast.success('Accesorio eliminado exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar accesorio: ' + error.message);
    },
  });

  // Calcular totales
  const totales = useMemo(() => {
    const inversionDisponible = accessories.reduce((sum, a) => sum + (Number(a.precioCompraUnitario) * Number(a.cantidadActual)), 0);
    const inversionVendida = accessories.reduce((sum, a) => sum + (Number(a.precioCompraUnitario) * Number(a.cantidadVendida)), 0);
    const ventaTotal = accessories.reduce((sum, a) => sum + (Number(a.precioVentaUnitario) * Number(a.cantidadVendida)), 0);
    const ganancia = ventaTotal - inversionVendida;
    const cantidadTotal = accessories.reduce((sum, a) => sum + Number(a.cantidadActual), 0);
    const cantidadVendida = accessories.reduce((sum, a) => sum + Number(a.cantidadVendida), 0);
    const stockBajo = accessories.filter(a => Number(a.cantidadActual) <= Number(a.stockMinimo));
    return { inversionDisponible, inversionVendida, ventaTotal, ganancia, cantidadTotal, cantidadVendida, productos: accessories.length, stockBajo: stockBajo.length };
  }, [accessories]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      nombre: formData.get('nombre') as string,
      categoria: (formData.get('categoria') as string) || '',
      precioCompraUnitario: formData.get('precioCompraUnitario') as string,
      precioVentaUnitario: formData.get('precioVentaUnitario') as string,
      cantidadInicial: Number(formData.get('cantidadInicial')),
      stockMinimo: Number(formData.get('stockMinimo')),
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccessory) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedAccessory.id,
      nombre: formData.get('nombre') as string,
      categoria: (formData.get('categoria') as string) || '',
      precioCompraUnitario: formData.get('precioCompraUnitario') as string,
      precioVentaUnitario: formData.get('precioVentaUnitario') as string,
      stockMinimo: Number(formData.get('stockMinimo')),
    });
  };

  const handleSell = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccessory) return;
    const formData = new FormData(e.currentTarget);
    sellMutation.mutate({
      id: selectedAccessory.id,
      cantidad: Number(formData.get('cantidad')),
      fecha: formData.get('fecha') as string,
    });
  };

  const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccessory) return;
    const formData = new FormData(e.currentTarget);
    addStockMutation.mutate({
      id: selectedAccessory.id,
      cantidad: Number(formData.get('cantidad')),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este accesorio?')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Headphones className="h-8 w-8 text-purple-600" />
              🔌 Inventario de Accesorios
            </h1>
            <p className="text-muted-foreground">Control de accesorios en stock</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Accesorio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Accesorio</DialogTitle>
                <DialogDescription>Registra un nuevo accesorio en el inventario</DialogDescription>
              </DialogHeader>
              <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" placeholder="ACC-001" required />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input id="categoria" name="categoria" placeholder="Cases, Chargers, etc." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre del Producto *</Label>
                  <Input id="nombre" name="nombre" placeholder="Case iPhone 13 Pro Silicone Black" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precioCompraUnitario">Precio Compra Unitario *</Label>
                    <Input id="precioCompraUnitario" name="precioCompraUnitario" type="number" step="0.01" placeholder="5.00" defaultValue="5.00" required />
                  </div>
                  <div>
                    <Label htmlFor="precioVentaUnitario">Precio Venta Unitario *</Label>
                    <Input id="precioVentaUnitario" name="precioVentaUnitario" type="number" step="0.01" placeholder="15.00" defaultValue="15.00" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cantidadInicial">Cantidad Inicial *</Label>
                    <Input id="cantidadInicial" name="cantidadInicial" type="number" placeholder="50" defaultValue="50" required />
                  </div>
                  <div>
                    <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
                    <Input id="stockMinimo" name="stockMinimo" type="number" defaultValue="3" required />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerta global de stock bajo */}
        {totales.stockBajo > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">
                ⚠️ {totales.stockBajo} accesorio{totales.stockBajo > 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-sm text-yellow-700">Revisa los accesorios marcados en amarillo y repón el inventario.</p>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-600">En Stock</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">{totales.cantidadTotal}</p>
            <p className="text-sm text-purple-600">{totales.productos} productos</p>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-600">Inversión</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">${totales.inversionDisponible.toFixed(2)}</p>
            <p className="text-sm text-orange-600">En stock</p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-600">Vendidos</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{totales.cantidadVendida}</p>
            <p className="text-sm text-green-600">${totales.ventaTotal.toFixed(2)}</p>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-600">Ganancia</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">${totales.ganancia.toFixed(2)}</p>
            <p className="text-sm text-emerald-600">Neta</p>
          </Card>
        </div>

        {/* Lista de Accesorios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessories.map((accessory) => {
            const stockBajo = Number(accessory.cantidadActual) <= Number(accessory.stockMinimo);
            const gananciaUnitaria = Number(accessory.precioVentaUnitario) - Number(accessory.precioCompraUnitario);
            const gananciaTotal = gananciaUnitaria * Number(accessory.cantidadVendida);
            return (
              <Card key={accessory.id} className={`p-4 ${stockBajo ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-mono text-gray-600">{accessory.codigo}</span>
                  </div>
                  {stockBajo && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                </div>
                <h3 className="font-semibold text-lg mb-1">{accessory.nombre}</h3>
                {accessory.categoria && <p className="text-sm text-gray-600 mb-3">{accessory.categoria}</p>}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`font-semibold ${stockBajo ? 'text-yellow-700' : 'text-gray-900'}`}>
                      {accessory.cantidadActual} / {accessory.stockMinimo} mín
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vendidos:</span>
                    <span className="font-semibold">{accessory.cantidadVendida}</span>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Compra:</span>
                    <span className="font-semibold">${Number(accessory.precioCompraUnitario).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Venta:</span>
                    <span className="font-semibold text-green-600">${Number(accessory.precioVentaUnitario).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ganancia/u:</span>
                    <span className="font-semibold text-emerald-600">${gananciaUnitaria.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">Ganancia Total:</span>
                    <span className="font-semibold text-emerald-700">${gananciaTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedAccessory(accessory); setAddStockDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Stock
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => { setSelectedAccessory(accessory); setSellDialogOpen(true); }} disabled={Number(accessory.cantidadActual) === 0}>
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Vender
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAccessory(accessory); setEditDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(accessory.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {accessories.length === 0 && (
          <Card className="p-12 text-center">
            <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay accesorios registrados</p>
          </Card>
        )}

        {/* Dialog de Venta */}
        <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Venta</DialogTitle>
              <DialogDescription>{selectedAccessory?.nombre}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <Label>Stock Disponible</Label>
                <p className="text-2xl font-bold text-gray-700">{selectedAccessory?.cantidadActual} unidades</p>
              </div>
              <div>
                <Label>Precio Unitario</Label>
                <p className="text-xl font-semibold text-green-600">
                  ${Number(selectedAccessory?.precioVentaUnitario || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="cantidad">Cantidad a Vender *</Label>
                <Input id="cantidad" name="cantidad" type="number" min="1" max={selectedAccessory?.cantidadActual} placeholder="1" required />
              </div>
              <div>
                <Label htmlFor="fecha">Fecha de Venta *</Label>
                <Input id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSellDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={sellMutation.isPending}>
                  {sellMutation.isPending ? 'Registrando...' : 'Confirmar Venta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Agregar Stock */}
        <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Stock</DialogTitle>
              <DialogDescription>{selectedAccessory?.nombre}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <Label>Stock Actual</Label>
                <p className="text-2xl font-bold text-gray-700">{selectedAccessory?.cantidadActual} unidades</p>
              </div>
              <div>
                <Label htmlFor="cantidad">Cantidad a Agregar *</Label>
                <Input id="cantidad" name="cantidad" type="number" min="1" placeholder="10" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddStockDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={addStockMutation.isPending}>
                  {addStockMutation.isPending ? 'Agregando...' : 'Agregar Stock'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar Accesorio */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedAccessory(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Accesorio</DialogTitle>
              <DialogDescription>Modifica los datos del accesorio seleccionado</DialogDescription>
            </DialogHeader>
            {selectedAccessory && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Código (no editable)</Label>
                    <Input value={selectedAccessory.codigo} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label htmlFor="edit-categoria">Categoría</Label>
                    <Input id="edit-categoria" name="categoria" defaultValue={selectedAccessory.categoria || ''} placeholder="Cases, Chargers, etc." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-nombre">Nombre del Producto *</Label>
                  <Input id="edit-nombre" name="nombre" defaultValue={selectedAccessory.nombre} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-precioCompraUnitario">Precio Compra Unitario *</Label>
                    <Input id="edit-precioCompraUnitario" name="precioCompraUnitario" type="number" step="0.01" defaultValue={selectedAccessory.precioCompraUnitario} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-precioVentaUnitario">Precio Venta Unitario *</Label>
                    <Input id="edit-precioVentaUnitario" name="precioVentaUnitario" type="number" step="0.01" defaultValue={selectedAccessory.precioVentaUnitario} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-stockMinimo">Stock Mínimo *</Label>
                  <Input id="edit-stockMinimo" name="stockMinimo" type="number" defaultValue={selectedAccessory.stockMinimo} required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
