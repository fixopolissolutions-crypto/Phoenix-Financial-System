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
import { Settings, Percent, DollarSign, Calendar, Globe, Save, Lock, Eye, EyeOff, Receipt, Loader2, Wrench, UserPlus, Trash2, ToggleLeft, ToggleRight, Phone } from 'lucide-react';

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
  const [taxRate, setTaxRate] = useState('8.25');
  const [diaInicioSemana, setDiaInicioSemana] = useState('1');
  const [diaFinSemana, setDiaFinSemana] = useState('0');
  const [zonaHoraria, setZonaHoraria] = useState('America/Chicago');
  const [reportEmail, setReportEmail] = useState('');
  
  const [hasChanges, setHasChanges] = useState(false);
  
  // Password states
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

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

  // ─── Técnicos ───────────────────────────────────────────────────────────────
  const [nuevoTecnico, setNuevoTecnico] = useState({ nombre: '', especialidad: '', telefono: '' });
  const [showTecnicoForm, setShowTecnicoForm] = useState(false);

  const { data: tecnicos = [], refetch: refetchTecnicos } = trpc.technicians.list.useQuery();

  const createTecnicoMutation = trpc.technicians.create.useMutation({
    onSuccess: () => {
      toast.success('Técnico agregado');
      setNuevoTecnico({ nombre: '', especialidad: '', telefono: '' });
      setShowTecnicoForm(false);
      refetchTecnicos();
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const updateTecnicoMutation = trpc.technicians.update.useMutation({
    onSuccess: () => { refetchTecnicos(); },
  });

  const deleteTecnicoMutation = trpc.technicians.delete.useMutation({
    onSuccess: () => { toast.success('Técnico eliminado'); refetchTecnicos(); },
  });

  // Cargar configuración cuando lleguen los datos
  useEffect(() => {
    if (configData) {
      setPorcentajeAhorro(configData.porcentajeAhorro || '30');
      setPorcentajeInversion(configData.porcentajeInversion || '20');
      setPorcentajeEmergencia(configData.porcentajeEmergencia || '10');
      setPorcentajeDisponible(configData.porcentajeDisponible || '40');
      setCajaChicaAdmin(configData.cajaChicaAdmin || '500');
      setTaxRate(configData.taxRate || '8.25');
      setDiaInicioSemana(configData.diaInicioSemana || '1');
      setDiaFinSemana(configData.diaFinSemana || '0');
      setZonaHoraria(configData.zonaHoraria || 'America/Chicago');
      setReportEmail(configData.reportEmail || '');
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
        setConfigMutation.mutateAsync({ key: 'taxRate', value: taxRate }),
        setConfigMutation.mutateAsync({ key: 'diaInicioSemana', value: diaInicioSemana }),
        setConfigMutation.mutateAsync({ key: 'diaFinSemana', value: diaFinSemana }),
        setConfigMutation.mutateAsync({ key: 'zonaHoraria', value: zonaHoraria }),
        setConfigMutation.mutateAsync({ key: 'reportEmail', value: reportEmail }),
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
                <Label htmlFor="cajaAdmin">Caja Chica - Fixopolis Solutions (Principal)</Label>
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

          {/* Email para Reportes */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reportes Semanales</h2>
                <p className="text-sm text-muted-foreground">Email para recibir reportes automáticos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportEmail">Emails para Reportes</Label>
                <Input
                  id="reportEmail"
                  type="text"
                  placeholder="email1@correo.com, email2@correo.com"
                  value={reportEmail}
                  onChange={(e) => handleChange(setReportEmail)(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes agregar múltiples emails separados por comas
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg mt-4">
                <p className="text-sm text-purple-800">
                  <strong>ℹ️ Información:</strong> Los reportes semanales se enviarán automáticamente al finalizar la semana laboral configurada.
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  Se generarán 2 PDFs: uno para la tienda principal y otro para la sucursal. Todos los emails configurados recibirán ambos reportes.
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


            </div>
          </Card>

          {/* ─── Sección de Técnicos ─── */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Técnicos</h3>
                  <p className="text-xs text-gray-500">Gestiona los técnicos disponibles para reparaciones</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowTecnicoForm(!showTecnicoForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Agregar Técnico
              </Button>
            </div>

            {/* Formulario de nuevo técnico */}
            {showTecnicoForm && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <h4 className="font-medium text-blue-800 text-sm">Nuevo Técnico</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nombre *</Label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={nuevoTecnico.nombre}
                      onChange={(e) => setNuevoTecnico(p => ({ ...p, nombre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Especialidad</Label>
                    <Input
                      placeholder="Ej: iPhone, Samsung"
                      value={nuevoTecnico.especialidad}
                      onChange={(e) => setNuevoTecnico(p => ({ ...p, especialidad: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      placeholder="Ej: 555-1234"
                      value={nuevoTecnico.telefono}
                      onChange={(e) => setNuevoTecnico(p => ({ ...p, telefono: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!nuevoTecnico.nombre.trim()) { toast.error('El nombre es requerido'); return; }
                      createTecnicoMutation.mutate(nuevoTecnico);
                    }}
                    disabled={createTecnicoMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createTecnicoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTecnicoForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Lista de técnicos */}
            {tecnicos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay técnicos registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tecnicos.map((t: any) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      t.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        t.activo ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {t.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{t.nombre}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {t.especialidad && <span>{t.especialidad}</span>}
                          {t.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />{t.telefono}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateTecnicoMutation.mutate({ id: t.id, activo: t.activo ? 0 : 1 })}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={t.activo ? 'Desactivar' : 'Activar'}
                      >
                        {t.activo
                          ? <ToggleRight className="h-6 w-6 text-green-500" />
                          : <ToggleLeft className="h-6 w-6 text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${t.nombre}?`)) {
                            deleteTecnicoMutation.mutate({ id: t.id });
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
