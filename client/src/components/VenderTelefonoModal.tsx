import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Search, DollarSign } from 'lucide-react';

interface VenderTelefonoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VenderTelefonoModal({ open, onOpenChange }: VenderTelefonoModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [precioVenta, setPrecioVenta] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const utils = trpc.useUtils();

  // Query para obtener teléfonos disponibles
  const { data: phones = [], isLoading } = trpc.inventoryPhones.list.useQuery({
    estado: 'disponible',
  });

  // Mutation para vender teléfono
  const sellMutation = trpc.inventoryPhones.sell.useMutation({
    onSuccess: (data) => {
      utils.inventoryPhones.list.invalidate();
      utils.transactions.list.invalidate();
      toast.success(`Teléfono vendido. Ganancia: $${data.ganancia}`);
      handleClose();
    },
    onError: (error) => {
      toast.error(`Error al vender teléfono: ${error.message}`);
    },
  });

  // Filtrar teléfonos por búsqueda
  const filteredPhones = phones.filter(phone => 
    phone.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phone.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phone.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Al seleccionar un teléfono, establecer precio de venta sugerido
  useEffect(() => {
    if (selectedPhone) {
      setPrecioVenta(selectedPhone.precioVenta || '');
    }
  }, [selectedPhone]);

  const handleClose = () => {
    setSearchTerm('');
    setSelectedPhone(null);
    setPrecioVenta('');
    setFecha(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPhone || !precioVenta || parseFloat(precioVenta) <= 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const precioCompra = parseFloat(selectedPhone.precioCompra);
    const precioVentaNum = parseFloat(precioVenta);

    if (precioVentaNum < precioCompra) {
      toast.error(`¡Advertencia! El precio de venta ($${precioVentaNum}) es menor que el precio de compra ($${precioCompra}). Perderás dinero.`);
      return;
    }

    sellMutation.mutate({
      id: selectedPhone.id,
      precioVenta: precioVenta,
      fecha: fecha,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vender Teléfono</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedPhone ? (
            <>
              {/* Búsqueda */}
              <div className="space-y-2">
                <Label>Buscar Teléfono (por código, modelo o marca)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ej: TEL-001, iPhone 13, Samsung..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de teléfonos */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredPhones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No se encontraron teléfonos' : 'No hay teléfonos disponibles'}
                  </p>
                ) : (
                  filteredPhones.map((phone) => (
                    <button
                      key={phone.id}
                      type="button"
                      onClick={() => setSelectedPhone(phone)}
                      className="w-full p-4 border rounded-lg hover:bg-accent text-left transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{phone.codigo}</p>
                          <p className="text-sm text-muted-foreground">{phone.marca} {phone.modelo}</p>
                          <p className="text-xs text-muted-foreground">IMEI: {phone.imei || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">Condición: {phone.condicion}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Compra:</p>
                          <p className="font-semibold text-red-600">${parseFloat(phone.precioCompra).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground mt-1">Venta sugerida:</p>
                          <p className="font-semibold text-green-600">${phone.precioVenta ? parseFloat(phone.precioVenta).toFixed(2) : 'N/A'}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Teléfono seleccionado */}
              <div className="p-4 border rounded-lg bg-accent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-lg">{selectedPhone.codigo}</p>
                    <p className="text-muted-foreground">{selectedPhone.marca} {selectedPhone.modelo}</p>
                    <p className="text-sm text-muted-foreground">IMEI: {selectedPhone.imei || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Condición: {selectedPhone.condicion}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPhone(null)}
                  >
                    Cambiar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded">
                  <div>
                    <p className="text-sm text-muted-foreground">Precio de Compra</p>
                    <p className="text-xl font-bold text-red-600">${parseFloat(selectedPhone.precioCompra).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venta Sugerida</p>
                    <p className="text-xl font-bold text-green-600">${selectedPhone.precioVenta ? parseFloat(selectedPhone.precioVenta).toFixed(2) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Precio de venta */}
              <div className="space-y-2">
                <Label htmlFor="precioVenta">Precio de Venta ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="precioVenta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
                {precioVenta && parseFloat(precioVenta) > 0 && (
                  <div className="text-sm">
                    <p className={parseFloat(precioVenta) >= parseFloat(selectedPhone.precioCompra) ? 'text-green-600' : 'text-red-600'}>
                      Ganancia: ${(parseFloat(precioVenta) - parseFloat(selectedPhone.precioCompra)).toFixed(2)}
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
            {selectedPhone && (
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
