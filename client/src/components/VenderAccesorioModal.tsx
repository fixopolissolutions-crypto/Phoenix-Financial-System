import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Search, DollarSign, Package } from 'lucide-react';

interface VenderAccesorioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VenderAccesorioModal({ open, onOpenChange }: VenderAccesorioModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState<any>(null);
  const [cantidad, setCantidad] = useState('1');
  const [precioVentaUnitario, setPrecioVentaUnitario] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const utils = trpc.useUtils();

  // Query para obtener accesorios disponibles
  const { data: accessories = [], isLoading } = trpc.inventoryAccessories.list.useQuery();

  // Mutation para vender accesorio
  const sellMutation = trpc.inventoryAccessories.sell.useMutation({
    onSuccess: (data) => {
      utils.inventoryAccessories.list.invalidate();
      utils.transactions.list.invalidate();
      toast.success(`Accesorio vendido. Ganancia: $${data.ganancia}`);
      handleClose();
    },
    onError: (error) => {
      toast.error(`Error al vender accesorio: ${error.message}`);
    },
  });

  // Filtrar accesorios por búsqueda y stock disponible
  const filteredAccessories = accessories.filter(acc => 
    acc.cantidadActual > 0 && (
      acc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Al seleccionar un accesorio, establecer precio de venta sugerido
  useEffect(() => {
    if (selectedAccessory) {
      setPrecioVentaUnitario(selectedAccessory.precioVentaUnitario || '');
    }
  }, [selectedAccessory]);

  const handleClose = () => {
    setSearchTerm('');
    setSelectedAccessory(null);
    setCantidad('1');
    setPrecioVentaUnitario('');
    setFecha(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccessory || !cantidad || !precioVentaUnitario) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    const precioCompraUnit = parseFloat(selectedAccessory.precioCompraUnitario);
    const precioVentaUnit = parseFloat(precioVentaUnitario);

    if (cantidadNum <= 0 || cantidadNum > selectedAccessory.cantidadActual) {
      toast.error(`Cantidad inválida. Stock disponible: ${selectedAccessory.cantidadActual}`);
      return;
    }

    if (precioVentaUnit < precioCompraUnit) {
      toast.error(`¡Advertencia! El precio de venta unitario ($${precioVentaUnit}) es menor que el precio de compra ($${precioCompraUnit}). Perderás dinero.`);
      return;
    }

    sellMutation.mutate({
      id: selectedAccessory.id,
      cantidad: cantidadNum,
      precioVentaUnitario: precioVentaUnitario,
      fecha: fecha,
    });
  };

  const gananciaTotal = selectedAccessory && cantidad && precioVentaUnitario
    ? (parseFloat(precioVentaUnitario) - parseFloat(selectedAccessory.precioCompraUnitario)) * parseInt(cantidad)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vender Accesorio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedAccessory ? (
            <>
              {/* Búsqueda */}
              <div className="space-y-2">
                <Label>Buscar Accesorio (por código o nombre)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ej: ACC-001, Protector de pantalla..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de accesorios */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredAccessories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No se encontraron accesorios' : 'No hay accesorios disponibles'}
                  </p>
                ) : (
                  filteredAccessories.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccessory(acc)}
                      className="w-full p-4 border rounded-lg hover:bg-accent text-left transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{acc.codigo}</p>
                          <p className="text-sm text-muted-foreground">{acc.nombre}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Package className="w-3 h-3" />
                            Stock: {acc.cantidadActual} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Compra/u:</p>
                          <p className="font-semibold text-red-600">${parseFloat(acc.precioCompraUnitario).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground mt-1">Venta/u sugerida:</p>
                          <p className="font-semibold text-green-600">${parseFloat(acc.precioVentaUnitario).toFixed(2)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Accesorio seleccionado */}
              <div className="p-4 border rounded-lg bg-accent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-lg">{selectedAccessory.codigo}</p>
                    <p className="text-muted-foreground">{selectedAccessory.nombre}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Package className="w-4 h-4" />
                      Stock disponible: {selectedAccessory.cantidadActual} unidades
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAccessory(null)}
                  >
                    Cambiar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded">
                  <div>
                    <p className="text-sm text-muted-foreground">Precio Compra/u</p>
                    <p className="text-xl font-bold text-red-600">${parseFloat(selectedAccessory.precioCompraUnitario).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venta/u Sugerida</p>
                    <p className="text-xl font-bold text-green-600">${parseFloat(selectedAccessory.precioVentaUnitario).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={selectedAccessory.cantidadActual}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Máximo: {selectedAccessory.cantidadActual} unidades
                </p>
              </div>

              {/* Precio de venta unitario */}
              <div className="space-y-2">
                <Label htmlFor="precioVenta">Precio de Venta Unitario ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="precioVenta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioVentaUnitario}
                    onChange={(e) => setPrecioVentaUnitario(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
                {precioVentaUnitario && parseFloat(precioVentaUnitario) > 0 && cantidad && (
                  <div className="text-sm space-y-1">
                    <p className={parseFloat(precioVentaUnitario) >= parseFloat(selectedAccessory.precioCompraUnitario) ? 'text-green-600' : 'text-red-600'}>
                      Ganancia/u: ${(parseFloat(precioVentaUnitario) - parseFloat(selectedAccessory.precioCompraUnitario)).toFixed(2)}
                    </p>
                    <p className="font-semibold">
                      Total venta: ${(parseFloat(precioVentaUnitario) * parseInt(cantidad)).toFixed(2)}
                    </p>
                    <p className={gananciaTotal >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Ganancia total: ${gananciaTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha de Venta</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {selectedAccessory && (
              <Button type="submit" disabled={sellMutation.isPending}>
                {sellMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vendiendo...
                  </>
                ) : (
                  'Confirmar Venta'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
