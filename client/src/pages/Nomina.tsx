import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, DollarSign, UserPlus, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Nomina() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [monto, setMonto] = useState('');
  const [empleadoId, setEmpleadoId] = useState('');
  const [metodo, setMetodo] = useState<'efectivo' | 'banco'>('efectivo');
  const [descripcion, setDescripcion] = useState('');
  
  const [nuevoEmpleado, setNuevoEmpleado] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoPuesto, setNuevoPuesto] = useState('');

  // Queries
  const { data: empleados = [], refetch: refetchEmpleados, isLoading: loadingEmpleados } = trpc.employees.list.useQuery();
  
  const today = new Date().toISOString().split('T')[0];
  const { data: pagosHoy = [], refetch: refetchPayroll, isLoading: loadingPayroll } = trpc.payroll.list.useQuery({
    tienda: user?.role || 'admin',
    fechaInicio: today,
    fechaFin: today,
  });

  // Mutations
  const createPayroll = trpc.payroll.create.useMutation({
    onSuccess: () => {
      refetchPayroll();
      toast.success('Pago registrado correctamente');
      setMonto('');
      setEmpleadoId('');
      setDescripcion('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      refetchEmpleados();
      toast.success('Empleado agregado correctamente');
      setNuevoEmpleado('');
      setNuevoTelefono('');
      setNuevoPuesto('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteEmployee = trpc.employees.delete.useMutation({
    onSuccess: () => {
      refetchEmpleados();
      toast.success('Empleado eliminado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleRegistrarPago = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || !empleadoId) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const empleado = empleados.find(e => e.id === parseInt(empleadoId));
    if (!empleado) {
      toast.error('Empleado no encontrado');
      return;
    }

    createPayroll.mutate({
      employeeId: parseInt(empleadoId),
      monto: monto,
      metodo,
      descripcion: descripcion || 'Pago de nómina',
      tienda: user?.role || 'admin',
      empleadoNombre: empleado.nombre,
    });
  };

  const handleAgregarEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoEmpleado || !nuevoTelefono) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    createEmployee.mutate({
      nombre: nuevoEmpleado,
      telefono: nuevoTelefono,
      puesto: nuevoPuesto || 'General',
      activo: true,
    });
  };

  const handleEliminarEmpleado = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      deleteEmployee.mutate({ id });
    }
  };

  const totalNominaHoy = pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  // Obtener nombres de empleados para los pagos
  const pagosConNombre = pagosHoy.map(pago => {
    const empleado = empleados.find(e => e.id === pago.employeeId);
    return {
      ...pago,
      empleadoNombre: empleado?.nombre || 'Desconocido',
    };
  });

  if (loadingEmpleados || loadingPayroll) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Nómina</h1>
          <p className="text-muted-foreground">Gestión de pagos a empleados - {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Registrar Pago</h2>
            </div>
            
            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empleado">Empleado</Label>
                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.filter(e => e.activo).map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombre} - {emp.puesto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pago</Label>
                <Select value={metodo} onValueChange={(v: 'efectivo' | 'banco') => setMetodo(v)}>
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
                <Input
                  id="descripcion"
                  placeholder="Ej: Pago quincenal"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createPayroll.isPending}>
                {createPayroll.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Pagos del Día</h2>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total pagado hoy</p>
              <p className="text-3xl font-bold text-blue-600">${totalNominaHoy.toFixed(2)}</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pagosConNombre.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No hay pagos registrados hoy</p>
              ) : (
                pagosConNombre.map((pago) => (
                  <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{pago.empleadoNombre}</p>
                      <p className="text-sm text-muted-foreground">{pago.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-${parseFloat(pago.monto).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pago.metodo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Gestión de Empleados</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleAgregarEmpleado} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nuevoEmpleado">Nombre del Empleado</Label>
                  <Input
                    id="nuevoEmpleado"
                    placeholder="Nombre completo"
                    value={nuevoEmpleado}
                    onChange={(e) => setNuevoEmpleado(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nuevoTelefono">Teléfono</Label>
                  <Input
                    id="nuevoTelefono"
                    placeholder="(512) 555-1234"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nuevoPuesto">Puesto</Label>
                  <Input
                    id="nuevoPuesto"
                    placeholder="Ej: Técnico, Vendedor"
                    value={nuevoPuesto}
                    onChange={(e) => setNuevoPuesto(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="outline" 
                  className="w-full"
                  disabled={createEmployee.isPending}
                >
                  {createEmployee.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Agregar Empleado
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                <h3 className="font-medium text-muted-foreground">Empleados Registrados</h3>
                {empleados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No hay empleados registrados</p>
                ) : (
                  empleados.map((emp) => (
                    <div key={emp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{emp.nombre}</p>
                        <p className="text-sm text-muted-foreground">{emp.puesto} • {emp.telefono}</p>
                        {!emp.activo && <span className="text-xs text-red-500">(Inactivo)</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleEliminarEmpleado(emp.id)}
                        disabled={deleteEmployee.isPending}
                      >
                        {deleteEmployee.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
