import { useState, useMemo } from 'react';
import ImagePickerModal from '@/components/ImagePickerModal';
import { BarcodeLabel, generateBarcodeString } from '@/components/BarcodeLabel';
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
import { Wrench, Plus, DollarSign, Package, Trash2, AlertCircle, Pencil, Barcode, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function InventarioPartes() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [barcodePart, setBarcodePart] = useState<any>(null);
  const [imagePickerPart, setImagePickerPart] = useState<any>(null);

  // Queries
  const { data: parts = [], refetch } = trpc.inventoryParts.list.useQuery({ activo: 1 });

  // Image mutation
  const updateImagenMutation = trpc.inventoryParts.updateImagen.useMutation({
    onSuccess: () => { toast.success('Imagen actualizada'); refetch(); setImagePickerPart(null); },
    onError: (e) => toast.error('Error al guardar imagen: ' + e.message),
  });

  // Mutations
  const createMutation = trpc.inventoryParts.create.useMutation({
    onSuccess: () => {
      toast.success('Parte agregada exitosamente');
      refetch();
      setDialogOpen(false);
      setFormKey(prev => prev + 1);
    },
    onError: (error) => {
      toast.error('Error al agregar parte: ' + error.message);
    },
  });

  const updateMutation = trpc.inventoryParts.update.useMutation({
    onSuccess: () => {
      toast.success('Parte actualizada exitosamente');
      refetch();
      setEditDialogOpen(false);
      setSelectedPart(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar parte: ' + error.message);
    },
  });

  const addStockMutation = trpc.inventoryParts.addStock.useMutation({
    onSuccess: () => {
      toast.success('Stock agregado exitosamente');
      refetch();
      setAddStockDialogOpen(false);
      setSelectedPart(null);
    },
    onError: (error) => {
      toast.error('Error al agregar stock: ' + error.message);
    },
  });

  const deleteMutation = trpc.inventoryParts.delete.useMutation({
    onSuccess: () => {
      toast.success('Parte eliminada exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar parte: ' + error.message);
    },
  });

  // Calcular totales
  const totales = useMemo(() => {
    const inversionDisponible = parts.reduce((sum, p) => sum + (Number(p.precioCompraUnitario) * Number(p.cantidadActual)), 0);
    const inversionUsada = parts.reduce((sum, p) => sum + (Number(p.precioCompraUnitario) * Number(p.cantidadUsada)), 0);
    const cantidadTotal = parts.reduce((sum, p) => sum + Number(p.cantidadActual), 0);
    const cantidadUsada = parts.reduce((sum, p) => sum + Number(p.cantidadUsada), 0);
    const stockBajo = parts.filter(p => Number(p.cantidadActual) <= Number(p.stockMinimo));
    return { inversionDisponible, inversionUsada, cantidadTotal, cantidadUsada, tipos: parts.length, stockBajo: stockBajo.length };
  }, [parts]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      nombre: formData.get('nombre') as string,
      categoria: (formData.get('categoria') as string) || '',
      compatibilidad: (formData.get('compatibilidad') as string) || '',
      precioCompraUnitario: formData.get('precioCompraUnitario') as string,
      cantidadInicial: Number(formData.get('cantidadInicial')),
      stockMinimo: Number(formData.get('stockMinimo')),
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPart) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedPart.id,
      nombre: formData.get('nombre') as string,
      categoria: (formData.get('categoria') as string) || '',
      compatibilidad: (formData.get('compatibilidad') as string) || '',
      precioCompraUnitario: formData.get('precioCompraUnitario') as string,
      stockMinimo: Number(formData.get('stockMinimo')),
    });
  };

  const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPart) return;
    const formData = new FormData(e.currentTarget);
    addStockMutation.mutate({
      id: selectedPart.id,
      cantidad: Number(formData.get('cantidad')),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta parte?')) {
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
              <Wrench className="h-8 w-8 text-gray-600" />
              🔧 Inventario de Partes
            </h1>
            <p className="text-muted-foreground">Control de partes para reparación</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Parte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Parte</DialogTitle>
                <DialogDescription>Registra una nueva parte en el inventario</DialogDescription>
              </DialogHeader>
              <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" placeholder="PART-001" required />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input id="categoria" name="categoria" placeholder="Pantallas, Baterías, etc." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre de la Parte *</Label>
                  <Input id="nombre" name="nombre" placeholder="Pantalla iPhone 13 Pro OLED" required />
                </div>
                <div>
                  <Label htmlFor="compatibilidad">Compatibilidad</Label>
                  <Textarea id="compatibilidad" name="compatibilidad" placeholder="iPhone 13 Pro, iPhone 13 Pro Max" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precioCompraUnitario">Precio Compra Unitario *</Label>
                    <Input id="precioCompraUnitario" name="precioCompraUnitario" type="number" step="0.01" placeholder="50.00" defaultValue="50.00" required />
                  </div>
                  <div>
                    <Label htmlFor="cantidadInicial">Cantidad Inicial *</Label>
                    <Input id="cantidadInicial" name="cantidadInicial" type="number" placeholder="10" defaultValue="10" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stockMinimo">Stock Mínimo (alerta de bajo stock) *</Label>
                  <Input id="stockMinimo" name="stockMinimo" type="number" defaultValue="3" required />
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
                ⚠️ {totales.stockBajo} parte{totales.stockBajo > 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-sm text-yellow-700">Revisa las partes marcadas en amarillo y repón el inventario.</p>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">En Stock</p>
            </div>
            <p className="text-2xl font-bold text-gray-700">{totales.cantidadTotal}</p>
            <p className="text-sm text-gray-600">{totales.tipos} tipos</p>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-600">Inversión</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">${totales.inversionDisponible.toFixed(2)}</p>
            <p className="text-sm text-orange-600">En stock</p>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-600">Usadas</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totales.cantidadUsada}</p>
            <p className="text-sm text-blue-600">${totales.inversionUsada.toFixed(2)}</p>
          </Card>
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-600">Stock Bajo</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{totales.stockBajo}</p>
            <p className="text-sm text-yellow-600">Requieren atención</p>
          </Card>
        </div>

        {/* Lista de Partes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts.map((part) => {
            const stockBajo = Number(part.cantidadActual) <= Number(part.stockMinimo);
            return (
              <Card key={part.id} className={`p-4 ${stockBajo ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                {/* Product image */}
                <div
                  className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-white flex items-center justify-center cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors group"
                  onClick={() => setImagePickerPart(part)}
                  title="Cambiar imagen"
                >
                  {part.imagen ? (
                    <img src={part.imagen} alt={part.nombre} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <ImageIcon size={24} />
                      <span className="text-xs">Agregar imagen</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-mono text-gray-600">{part.codigo}</span>
                  </div>
                  {stockBajo && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                </div>
                <h3 className="font-semibold text-lg mb-1">{part.nombre}</h3>
                {part.categoria && <p className="text-sm text-gray-600 mb-2">{part.categoria}</p>}
                {part.compatibilidad && (
                  <p className="text-xs text-gray-500 mb-3 bg-gray-100 p-2 rounded">
                    Compatible: {part.compatibilidad}
                  </p>
                )}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className={`font-semibold ${stockBajo ? 'text-yellow-700' : 'text-gray-900'}`}>
                      {part.cantidadActual} / {part.stockMinimo} mín
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usadas:</span>
                    <span className="font-semibold">{part.cantidadUsada}</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Costo Unitario:</span>
                    <span className="font-semibold">${Number(part.precioCompraUnitario).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Inversión Total:</span>
                    <span className="font-semibold text-orange-600">
                      ${(Number(part.precioCompraUnitario) * Number(part.cantidadActual)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSelectedPart(part); setAddStockDialogOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    title="Código de barras"
                    onClick={() => setBarcodePart(part)}
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedPart(part); setEditDialogOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(part.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {parts.length === 0 && (
          <Card className="p-12 text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay partes registradas</p>
          </Card>
        )}

        {/* Dialog de Agregar Stock */}
        <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Stock</DialogTitle>
              <DialogDescription>{selectedPart?.nombre}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <Label>Stock Actual</Label>
                <p className="text-2xl font-bold text-gray-700">{selectedPart?.cantidadActual} unidades</p>
              </div>
              <div>
                <Label>Costo Unitario</Label>
                <p className="text-xl font-semibold text-orange-600">
                  ${Number(selectedPart?.precioCompraUnitario || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="cantidad">Cantidad a Agregar *</Label>
                <Input id="cantidad" name="cantidad" type="number" min="1" placeholder="5" required />
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

        {/* Dialog de Editar Parte */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedPart(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Parte</DialogTitle>
              <DialogDescription>Modifica los datos de la parte seleccionada</DialogDescription>
            </DialogHeader>
            {selectedPart && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Código (no editable)</Label>
                    <Input value={selectedPart.codigo} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label htmlFor="edit-categoria">Categoría</Label>
                    <Input id="edit-categoria" name="categoria" defaultValue={selectedPart.categoria || ''} placeholder="Pantallas, Baterías, etc." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-nombre">Nombre de la Parte *</Label>
                  <Input id="edit-nombre" name="nombre" defaultValue={selectedPart.nombre} required />
                </div>
                <div>
                  <Label htmlFor="edit-compatibilidad">Compatibilidad</Label>
                  <Textarea id="edit-compatibilidad" name="compatibilidad" defaultValue={selectedPart.compatibilidad || ''} placeholder="iPhone 13 Pro, iPhone 13 Pro Max" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-precioCompraUnitario">Precio Compra Unitario *</Label>
                    <Input id="edit-precioCompraUnitario" name="precioCompraUnitario" type="number" step="0.01" defaultValue={selectedPart.precioCompraUnitario} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-stockMinimo">Stock Mínimo *</Label>
                    <Input id="edit-stockMinimo" name="stockMinimo" type="number" defaultValue={selectedPart.stockMinimo} required />
                  </div>
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

      {/* Image Picker Modal */}
      {imagePickerPart && (
        <ImagePickerModal
          currentImage={imagePickerPart.imagen}
          onSelect={(url) => updateImagenMutation.mutate({ id: imagePickerPart.id, imagen: url || null })}
          onClose={() => setImagePickerPart(null)}
        />
      )}

      {/* Barcode Label Modal */}
      {barcodePart && (
        <BarcodeLabel
          barcode={barcodePart.barcode || generateBarcodeString('parte', barcodePart.id)}
          nombre={barcodePart.nombre}
          precio={Number(barcodePart.precioCompraUnitario)}
          tipo="parte"
          onClose={() => setBarcodePart(null)}
        />
      )}
    </DashboardLayout>
  );
}
