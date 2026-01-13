import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Settings, Percent, DollarSign, Calendar, Globe, Save, Lock, Eye, EyeOff, Receipt, Loader2 } from 'lucide-react';

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

const ZONAS_HORARIAS = [
  { value: 'America/Chicago', label: 'Central (Austin, TX) - America/Chicago' },
  { value: 'America/New_York', label: 'Eastern - America/New_York' },
  { value: 'America/Los_Angeles', label: 'Pacific - America/Los_Angeles' },
  { value: 'America/Denver', label: 'Mountain - America/Denver' },
  { value: 'America/Mexico_City', label: 'México - America/Mexico_City' },
];

export default function Configuracion() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Config states
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('30');
  const [porcentajeInversion, setPorcentajeInversion] = useState('20');
  const [porcentajeEmergencia, setPorcentajeEmergencia] = useState('10');
  const [porcentajeDisponible, setPorcentajeDisponible] = useState('40');
  const [cajaChicaAdmin, setCajaChicaAdmin] = useState('500');
  const [cajaChicaSucursal, setCajaChicaSucursal] = useState('300');
  const [taxRate, setTaxRate] = useState('8.25');
  const [diaInicioSemana, setDiaInicioSemana] = useState('1');
  const [diaFinSemana, setDiaFinSemana] = useState('0');
  const [zonaHoraria, setZonaHoraria] = useState('America/Chicago');
  
  const [hasChanges, setHasChanges] = useState(false);
  
  // Password states
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [sucursalPassword, setSucursalPassword] = useState('');
  const [sucursalPasswordConfirm, setSucursalPasswordConfirm] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSucursalPassword, setShowSucursalPassword] = useState(false);

  const utils = trpc.useUtils();
  
  // Query para obtener configuración
  const { data: configData = {}, isLoading } = trpc.config.getAll.useQuery();

  // Mutation para guardar configuración
  const setConfigMutation = trpc.config.set.useMutation({
    onSuccess: () => {
      utils.config.getAll.invalidate();
    },
  });

  // Mutation para cambiar contraseña
  const changePasswordMutation = trpc.localUsers.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la contraseña');
    },
  });

  // Cargar configuración cuando lleguen los datos
  useEffect(() => {
    if (configData) {
      setPorcentajeAhorro(configData.porcentajeAhorro || '30');
      setPorcentajeInversion(configData.porcentajeInversion || '20');
      setPorcentajeEmergencia(configData.porcentajeEmergencia || '10');
      setPorcentajeDisponible(configData.porcentajeDisponible || '40');
      setCajaChicaAdmin(configData.cajaChicaAdmin || '500');
      setCajaChicaSucursal(configData.cajaChicaSucursal || '300');
      setTaxRate(configData.taxRate || '8.25');
      setDiaInicioSemana(configData.diaInicioSemana || '1');
      setDiaFinSemana(configData.diaFinSemana || '0');
      setZonaHoraria(configData.zonaHoraria || 'America/Chicago');
    }
  }, [configData]);

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const total = parseFloat(porcentajeAhorro) + parseFloat(porcentajeInversion) + 
                  parseFloat(porcentajeEmergencia) + parseFloat(porcentajeDisponible);
    
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Los porcentajes deben sumar 100%. Actualmente suman ${total.toFixed(2)}%`);
      return;
    }

    try {
      await Promise.all([
        setConfigMutation.mutateAsync({ key: 'porcentajeAhorro', value: porcentajeAhorro }),
        setConfigMutation.mutateAsync({ key: 'porcentajeInversion', value: porcentajeInversion }),
        setConfigMutation.mutateAsync({ key: 'porcentajeEmergencia', value: porcentajeEmergencia }),
        setConfigMutation.mutateAsync({ key: 'porcentajeDisponible', value: porcentajeDisponible }),
        setConfigMutation.mutateAsync({ key: 'cajaChicaAdmin', value: cajaChicaAdmin }),
        setConfigMutation.mutateAsync({ key: 'cajaChicaSucursal', value: cajaChicaSucursal }),
        setConfigMutation.mutateAsync({ key: 'taxRate', value: taxRate }),
        setConfigMutation.mutateAsync({ key: 'diaInicioSemana', value: diaInicioSemana }),
        setConfigMutation.mutateAsync({ key: 'diaFinSemana', value: diaFinSemana }),
        setConfigMutation.mutateAsync({ key: 'zonaHoraria', value: zonaHoraria }),
      ]);
      
      setHasChanges(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  };

  const handleChangeAdminPassword = async () => {
    if (adminPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (adminPassword !== adminPasswordConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        username: 'admin',
        newPassword: adminPassword,
      });
      setAdminPassword('');
      setAdminPasswordConfirm('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChangeSucursalPassword = async () => {
    if (sucursalPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (sucursalPassword !== sucursalPasswordConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        username: 'sucursal',
        newPassword: sucursalPassword,
      });
      setSucursalPassword('');
      setSucursalPasswordConfirm('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              Solo el administrador puede modificar la configuración del sistema.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalPorcentaje = parseFloat(porcentajeAhorro || '0') + parseFloat(porcentajeInversion || '0') + 
                         parseFloat(porcentajeEmergencia || '0') + parseFloat(porcentajeDisponible || '0');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Configuración</h1>
            <p className="text-muted-foreground">Ajusta los parámetros del sistema</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} className="gap-2" disabled={setConfigMutation.isPending}>
              {setConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución de Fondos */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Distribución de Fondos</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {totalPorcentaje.toFixed(2)}% 
                  {Math.abs(totalPorcentaje - 100) > 0.01 && (
                    <span className="text-red-500 ml-2">(debe ser 100%)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ahorro">Porcentaje Ahorro (%)</Label>
                <Input
                  id="ahorro"
                  type="number"
                  min="0"
                  max="100"
                  value={porcentajeAhorro}
                  onChange={(e) => handleChange(setPorcentajeAhorro)(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inversion">Porcentaje Inversión (%)</Label>
                <Input
                  id="inversion"
                  type="number"
                  min="0"
                  max="100"
                  value={porcentajeInversion}
                  onChange={(e) => handleChange(setPorcentajeInversion)(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencia">Porcentaje Emergencia (%)</Label>
                <Input
                  id="emergencia"
                  type="number"
                  min="0"
                  max="100"
                  value={porcentajeEmergencia}
                  onChange={(e) => handleChange(setPorcentajeEmergencia)(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disponible">Porcentaje Disponible (%)</Label>
                <Input
                  id="disponible"
                  type="number"
                  min="0"
                  max="100"
                  value={porcentajeDisponible}
                  onChange={(e) => handleChange(setPorcentajeDisponible)(e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> La distribución se calcula sobre el ingreso NETO (después de descontar taxes).
                </p>
              </div>
            </div>
          </Card>

          {/* Caja Chica */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Caja Chica</h2>
                <p className="text-sm text-muted-foreground">Fondos de reserva por tienda</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cajaAdmin">Caja Chica - 1+PhoneFix (Principal)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cajaAdmin"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={cajaChicaAdmin}
                    onChange={(e) => handleChange(setCajaChicaAdmin)(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cajaSucursal">Caja Chica - 1+PhoneFix Downtown (Sucursal)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cajaSucursal"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={cajaChicaSucursal}
                    onChange={(e) => handleChange(setCajaChicaSucursal)(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Impuestos */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Impuestos (Taxes)</h2>
                <p className="text-sm text-muted-foreground">Porcentaje de impuestos sobre ingresos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Porcentaje de Tax (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="pl-10"
                    value={taxRate}
                    onChange={(e) => handleChange(setTaxRate)(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">Ejemplo de Cálculo:</h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Ingreso Bruto: $100.00</p>
                  <p>• Tax ({taxRate}%): ${(100 * (parseFloat(taxRate) / 100)).toFixed(2)}</p>
                  <p>• Ingreso Neto: ${(100 - (100 * (parseFloat(taxRate) / 100))).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Semana Laboral */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Semana Laboral</h2>
                <p className="text-sm text-muted-foreground">Configura el ciclo de reportes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diaInicio">Día de Inicio de Semana</Label>
                <Select 
                  value={diaInicioSemana} 
                  onValueChange={handleChange(setDiaInicioSemana)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diaFin">Día de Fin de Semana</Label>
                <Select 
                  value={diaFinSemana} 
                  onValueChange={handleChange(setDiaFinSemana)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Zona Horaria */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Zona Horaria</h2>
                <p className="text-sm text-muted-foreground">ZIP Code: 78741 (Austin, TX)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zonaHoraria">Zona Horaria</Label>
                <Select 
                  value={zonaHoraria} 
                  onValueChange={handleChange(setZonaHoraria)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONAS_HORARIAS.map((zona) => (
                      <SelectItem key={zona.value} value={zona.value}>
                        {zona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg mt-4">
                <p className="text-sm text-orange-800">
                  <strong>Hora actual:</strong> {new Date().toLocaleString('es-MX', { timeZone: zonaHoraria })}
                </p>
              </div>
            </div>
          </Card>

          {/* Contraseñas */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Seguridad</h2>
                <p className="text-sm text-muted-foreground">Cambiar contraseñas de acceso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin Password */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Contraseña Administrador</h3>
                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Contraseña</Label>
                  <Input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPasswordConfirm}
                    onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                    placeholder="Confirmar contraseña"
                  />
                </div>
                <Button 
                  onClick={handleChangeAdminPassword} 
                  variant="outline" 
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Cambiar Contraseña Admin
                </Button>
              </div>

              {/* Sucursal Password */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Contraseña Sucursal</h3>
                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showSucursalPassword ? 'text' : 'password'}
                      value={sucursalPassword}
                      onChange={(e) => setSucursalPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowSucursalPassword(!showSucursalPassword)}
                    >
                      {showSucursalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Contraseña</Label>
                  <Input
                    type={showSucursalPassword ? 'text' : 'password'}
                    value={sucursalPasswordConfirm}
                    onChange={(e) => setSucursalPasswordConfirm(e.target.value)}
                    placeholder="Confirmar contraseña"
                  />
                </div>
                <Button 
                  onClick={handleChangeSucursalPassword} 
                  variant="outline" 
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Cambiar Contraseña Sucursal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
