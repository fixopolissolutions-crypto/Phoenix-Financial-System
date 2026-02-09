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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Smartphone, Plus, DollarSign, TrendingUp, Package, Trash2, Edit, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InventarioTelefonos() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'disponible' | 'vendido' | 'reservado'>('todos');

  // Queries
  const { data: phones = [], refetch } = trpc.inventoryPhones.list.useQuery();
  
  // Mutations
  const createMutation = trpc.inventoryPhones.create.useMutation({
    onSuccess: () => {
      toast.success('Teléfono agregado exitosamente');
      refetch();
      setDialogOpen(false);
      setFormKey(prev => prev + 1);
    },
    onError: (error) => {
      toast.error('Error al agregar teléfono: ' + error.message);
    },
  });

  const sellMutation = trpc.inventoryPhones.sell.useMutation({
    onSuccess: () => {
      toast.success('Teléfono vendido exitosamente');
      refetch();
      setSellDialogOpen(false);
      setSelectedPhone(null);
    },
    onError: (error) => {
      toast.error('Error al vender teléfono: ' + error.message);
    },
  });

  const deleteMutation = trpc.inventoryPhones.delete.useMutation({
    onSuccess: () => {
      toast.success('Teléfono eliminado exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar teléfono: ' + error.message);
    },
  });

  // Filtrar teléfonos
  const phonesFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return phones;
    return phones.filter(p => p.estado === filtroEstado);
  }, [phones, filtroEstado]);

  // Calcular totales
  const totales = useMemo(() => {
    const disponibles = phones.filter(p => p.estado === 'disponible');
    const vendidos = phones.filter(p => p.estado === 'vendido');
    
    const inversionDisponible = disponibles.reduce((sum, p) => sum + Number(p.precioCompra), 0);
    const inversionVendida = vendidos.reduce((sum, p) => sum + Number(p.precioCompra), 0);
    const ventaTotal = vendidos.reduce((sum, p) => sum + Number(p.precioVenta || 0), 0);
    const ganancia = ventaTotal - inversionVendida;

    return {
      disponibles: disponibles.length,
      vendidos: vendidos.length,
      inversionDisponible,
      inversionVendida,
      ventaTotal,
      ganancia,
    };
  }, [phones]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      codigo: formData.get('codigo') as string,
      modelo: formData.get('modelo') as string,
      marca: formData.get('marca') as string,
      imei: (formData.get('imei') as string) || null,
      carrier: (formData.get('carrier') as string) || null,
      condicion: formData.get('condicion') as any,
      precioCompra: formData.get('precioCompra') as string,
      fechaCompra: formData.get('fechaCompra') as string,
      notas: (formData.get('notas') as string) || null,
    });
  };

  const handleSell = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPhone) return;
    
    const formData = new FormData(e.currentTarget);
    
    sellMutation.mutate({
      id: selectedPhone.id,
      precioVenta: formData.get('precioVenta') as string,
      fechaVenta: formData.get('fechaVenta') as string,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este teléfono?')) {
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
              <Smartphone className="h-8 w-8 text-blue-600" />
              📱 Inventario de Teléfonos
            </h1>
            <p className="text-muted-foreground">
              Control de teléfonos en stock y vendidos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Teléfono
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Teléfono</DialogTitle>
                <DialogDescription>
                  Registra un nuevo teléfono en el inventario
                </DialogDescription>
              </DialogHeader>
              <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" name="codigo" placeholder="TEL-001" required />
                  </div>
                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <Input id="marca" name="marca" placeholder="Apple" required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input id="modelo" name="modelo" placeholder="iPhone 13 Pro 256GB Gold" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imei">IMEI</Label>
                    <Input id="imei" name="imei" placeholder="123456789012345" />
                  </div>
                  <div>
                    <Label htmlFor="carrier">Carrier</Label>
                    <Input id="carrier" name="carrier" placeholder="Unlocked" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condicion">Condición *</Label>
                    <Select name="condicion" defaultValue="usado_a" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo</SelectItem>
                        <SelectItem value="usado_a">Usado A (Excelente)</SelectItem>
                        <SelectItem value="usado_b">Usado B (Bueno)</SelectItem>
                        <SelectItem value="usado_c">Usado C (Regular)</SelectItem>
                        <SelectItem value="para_partes">Para Partes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="precioCompra">Precio de Compra *</Label>
                    <Input 
                      id="precioCompra" 
                      name="precioCompra" 
                      type="number" 
                      step="0.01" 
                      placeholder="500.00" 
                      defaultValue="500.00"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fechaCompra">Fecha de Compra *</Label>
                  <Input 
                    id="fechaCompra" 
                    name="fechaCompra" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea id="notas" name="notas" placeholder="Observaciones adicionales" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-600">Disponibles</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totales.disponibles}</p>
            <p className="text-sm text-blue-600">${totales.inversionDisponible.toFixed(2)}</p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-600">Vendidos</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{totales.vendidos}</p>
            <p className="text-sm text-green-600">${totales.ventaTotal.toFixed(2)}</p>
          </Card>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-600">Inversión</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">${totales.inversionVendida.toFixed(2)}</p>
            <p className="text-sm text-orange-600">Recuperada</p>
          </Card>

          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-600">Ganancia</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">${totales.ganancia.toFixed(2)}</p>
            <p className="text-sm text-emerald-600">Neta</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Label>Filtrar por estado:</Label>
            <div className="flex gap-2">
              <Button
                variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({phones.length})
              </Button>
              <Button
                variant={filtroEstado === 'disponible' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('disponible')}
              >
                Disponibles ({totales.disponibles})
              </Button>
              <Button
                variant={filtroEstado === 'vendido' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('vendido')}
              >
                Vendidos ({totales.vendidos})
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Teléfonos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phonesFiltrados.map((phone) => {
            const ganancia = phone.estado === 'vendido' 
              ? Number(phone.precioVenta || 0) - Number(phone.precioCompra)
              : 0;

            return (
              <Card key={phone.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-mono text-gray-600">{phone.codigo}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    phone.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                    phone.estado === 'vendido' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {phone.estado === 'disponible' ? 'Disponible' :
                     phone.estado === 'vendido' ? 'Vendido' : 'Reservado'}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-1">{phone.modelo}</h3>
                <p className="text-sm text-gray-600 mb-2">{phone.marca}</p>

                <div className="space-y-1 mb-3 text-sm">
                  {phone.imei && (
                    <p className="text-gray-600">IMEI: {phone.imei}</p>
                  )}
                  {phone.carrier && (
                    <p className="text-gray-600">Carrier: {phone.carrier}</p>
                  )}
                  <p className="text-gray-600">Condición: {phone.condicion}</p>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio Compra:</span>
                    <span className="font-semibold">${Number(phone.precioCompra).toFixed(2)}</span>
                  </div>
                  {phone.estado === 'vendido' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precio Venta:</span>
                        <span className="font-semibold text-green-600">
                          ${Number(phone.precioVenta).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ganancia:</span>
                        <span className="font-semibold text-emerald-600">
                          ${ganancia.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {phone.notas && (
                  <p className="text-xs text-gray-500 mt-2 border-t pt-2">{phone.notas}</p>
                )}

                <div className="flex gap-2 mt-4">
                  {phone.estado === 'disponible' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPhone(phone);
                        setSellDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Vender
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(phone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {phonesFiltrados.length === 0 && (
          <Card className="p-12 text-center">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay teléfonos en esta categoría</p>
          </Card>
        )}

        {/* Dialog de Venta */}
        <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vender Teléfono</DialogTitle>
              <DialogDescription>
                {selectedPhone?.modelo} - {selectedPhone?.codigo}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <Label>Precio de Compra</Label>
                <p className="text-2xl font-bold text-gray-700">
                  ${Number(selectedPhone?.precioCompra || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="precioVenta">Precio de Venta *</Label>
                <Input 
                  id="precioVenta" 
                  name="precioVenta" 
                  type="number" 
                  step="0.01" 
                  placeholder="700.00" 
                  required 
                />
              </div>

              <div>
                <Label htmlFor="fechaVenta">Fecha de Venta *</Label>
                <Input 
                  id="fechaVenta" 
                  name="fechaVenta" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSellDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sellMutation.isPending}>
                  {sellMutation.isPending ? 'Vendiendo...' : 'Confirmar Venta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
