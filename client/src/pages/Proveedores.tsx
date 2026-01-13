import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/utils/storage';
import { toast } from 'sonner';
import { Plus, Users, Trash2, Phone } from 'lucide-react';

export default function Proveedores() {
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [numero, setNumero] = useState('');
  const [proveedores, setProveedores] = useState(storage.getProviders());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !numero) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const newProvider = {
      id: Date.now().toString(),
      nombre,
      telefono: numero,
    };

    const updated = [...proveedores, newProvider];
    storage.saveProviders(updated);
    setProveedores(updated);
    toast.success('Proveedor agregado exitosamente');
    
    setNombre('');
    setNumero('');
  };

  const handleDelete = (id: string) => {
    const updated = proveedores.filter(p => p.id !== id);
    storage.saveProviders(updated);
    setProveedores(updated);
    toast.success('Proveedor eliminado');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Proveedores</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Gestiona la lista de proveedores' : 'Lista de proveedores disponibles'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAdmin && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Nuevo Proveedor</h2>
                  <p className="text-sm text-muted-foreground">Agrega un proveedor</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número de Contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="numero"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="pl-10"
                      placeholder="555-1234"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Proveedor
                </Button>
              </form>
            </Card>
          )}

          <Card className={`p-6 ${isAdmin ? '' : 'lg:col-span-2'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Lista de Proveedores</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {proveedores.length}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {proveedores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay proveedores registrados
                </p>
              ) : (
                proveedores.map((proveedor) => (
                  <div
                    key={proveedor.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{proveedor.nombre}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {proveedor.telefono}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(proveedor.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
