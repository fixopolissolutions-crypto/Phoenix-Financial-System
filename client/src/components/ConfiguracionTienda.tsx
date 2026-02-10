import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Save, Loader2 } from 'lucide-react';

export function ConfiguracionTienda() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // Obtener usuario actual para saber qué tienda es
  const { data: user } = trpc.user.me.useQuery();
  const tienda = user?.tienda || 'admin';
  
  // Obtener configuración actual de la tienda
  const { data: storeConfig, isLoading } = trpc.storeConfig.get.useQuery({
    tienda,
  });

  // Estado local para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
  });

  // Actualizar formData cuando se carga la configuración
  React.useEffect(() => {
    if (storeConfig) {
      setFormData({
        nombre: storeConfig.nombre || '',
        telefono: storeConfig.telefono || '',
        email: storeConfig.email || '',
        direccion: storeConfig.direccion || '',
        ciudad: storeConfig.ciudad || '',
        estado: storeConfig.estado || '',
        codigoPostal: storeConfig.codigoPostal || '',
      });
    }
  }, [storeConfig]);

  // Mutación para actualizar configuración
  const updateConfig = trpc.storeConfig.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Configuración actualizada',
        description: 'La información de la tienda se ha guardado correctamente.',
      });
      utils.storeConfig.get.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la configuración.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig.mutate({
      tienda,
      ...formData,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            <CardTitle>Configuración de Tienda</CardTitle>
          </div>
          <CardDescription>
            Configure la información de contacto que aparecerá en los recibos de reparación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Tienda</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="1+PhoneFix"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="(512) XXX-XXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contacto@1plusphonefix.com"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dirección</h3>
              
              <div className="space-y-2">
                <Label htmlFor="direccion">Calle y Número</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Austin"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    placeholder="TX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    placeholder="78701"
                  />
                </div>
              </div>
            </div>

            {/* Vista previa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vista Previa del Recibo</h3>
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-gray-800">
                    {formData.nombre || 'Nombre de la Tienda'}
                  </p>
                  <p className="text-sm text-gray-600">Reparación de Teléfonos</p>
                  {formData.direccion && (
                    <p className="text-sm text-gray-600">{formData.direccion}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {formData.ciudad || 'Ciudad'}, {formData.estado || 'Estado'} {formData.codigoPostal}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tel: {formData.telefono || '(XXX) XXX-XXXX'}
                  </p>
                  {formData.email && (
                    <p className="text-sm text-gray-600">{formData.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de guardar */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateConfig.isPending}
                className="flex items-center gap-2"
              >
                {updateConfig.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
