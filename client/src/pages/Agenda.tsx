import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, User,
  Smartphone, Trash2, Edit, Check, X, Phone,
} from 'lucide-react';

// ─── Constantes ────────────────────────────────────────────────────────────
const HORAS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8; // 8am a 9pm
  return `${String(h).padStart(2, '0')}:00`;
});

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  programada:  { label: 'Programada',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300' },
  confirmada:  { label: 'Confirmada',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300' },
  completada:  { label: 'Completada',  bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-300' },
  cancelada:   { label: 'Cancelada',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300' },
  no_asistio:  { label: 'No asistió',  bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
};

const COLORES = [
  { value: '#f97316', label: 'Naranja' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#8b5cf6', label: 'Morado' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f59e0b', label: 'Amarillo' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Rosa' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(diff + i);
    return nd;
  });
}

function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatHora(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'semana' | 'dia' | 'lista'>('semana');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHora, setSelectedHora] = useState<string>('');

  const [form, setForm] = useState({
    titulo: '', cliente: '', telefono: '', dispositivo: '',
    descripcion: '', tecnico: '', fecha: '', horaInicio: '09:00',
    horaFin: '10:00', estado: 'programada', color: '#f97316', notas: '',
  });

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const fechaInicio = dateToStr(weekDates[0]);
  const fechaFin = dateToStr(weekDates[6]);

  const { data: appointments = [], refetch } = trpc.appointments.list.useQuery({
    fechaInicio, fechaFin,
  });

  const { data: tecnicos = [] } = trpc.technicians.list.useQuery();

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => { toast.success('Cita registrada'); refetch(); setDialogOpen(false); resetForm(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => { toast.success('Cita actualizada'); refetch(); setDialogOpen(false); setEditingAppointment(null); resetForm(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const deleteMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => { toast.success('Cita eliminada'); refetch(); },
    onError: (e) => toast.error('Error: ' + e.message),
  });

  const resetForm = () => setForm({
    titulo: '', cliente: '', telefono: '', dispositivo: '',
    descripcion: '', tecnico: '', fecha: dateToStr(currentDate), horaInicio: '09:00',
    horaFin: '10:00', estado: 'programada', color: '#f97316', notas: '',
  });

  const openNew = (fecha?: string, hora?: string) => {
    resetForm();
    setEditingAppointment(null);
    if (fecha) setForm(f => ({ ...f, fecha }));
    if (hora) setForm(f => ({ ...f, horaInicio: hora, horaFin: `${String(parseInt(hora) + 1).padStart(2, '0')}:00` }));
    setDialogOpen(true);
  };

  const openEdit = (appt: any) => {
    setEditingAppointment(appt);
    setForm({
      titulo: appt.titulo || '',
      cliente: appt.cliente || '',
      telefono: appt.telefono || '',
      dispositivo: appt.dispositivo || '',
      descripcion: appt.descripcion || '',
      tecnico: appt.tecnico || '',
      fecha: appt.fecha?.split('T')[0] || appt.fecha || '',
      horaInicio: appt.horaInicio?.substring(0, 5) || '09:00',
      horaFin: appt.horaFin?.substring(0, 5) || '10:00',
      estado: appt.estado || 'programada',
      color: appt.color || '#f97316',
      notas: appt.notas || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.titulo || !form.fecha || !form.horaInicio) {
      toast.error('Título, fecha y hora son requeridos');
      return;
    }
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, ...form });
    } else {
      createMutation.mutate(form as any);
    }
  };

  // Agrupar citas por fecha
  const apptsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of appointments as any[]) {
      const key = a.fecha?.split('T')[0] || a.fecha;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [appointments]);

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const goToday = () => setCurrentDate(new Date());

  const today = dateToStr(new Date());

  // ─── Vista Semana ──────────────────────────────────────────────────────────
  const renderSemana = () => (
    <div className="overflow-x-auto">
      {/* Header días */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="p-3 text-xs text-gray-400 font-medium border-r border-gray-200">Hora</div>
        {weekDates.map((d, i) => {
          const ds = dateToStr(d);
          const isToday = ds === today;
          const count = (apptsByDate[ds] || []).length;
          return (
            <div key={i} className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-orange-50' : ''}`}>
              <p className={`text-xs font-medium ${isToday ? 'text-orange-600' : 'text-gray-500'}`}>{DIAS_SEMANA[d.getDay()]}</p>
              <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>{d.getDate()}</p>
              {count > 0 && (
                <span className="inline-block mt-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid de horas */}
      <div className="relative">
        {HORAS.map(hora => (
          <div key={hora} className="grid grid-cols-8 border-b border-gray-100 min-h-[64px]">
            <div className="p-2 text-xs text-gray-400 border-r border-gray-200 flex items-start pt-2">
              {formatHora(hora)}
            </div>
            {weekDates.map((d, di) => {
              const ds = dateToStr(d);
              const isToday = ds === today;
              const citasHora = (apptsByDate[ds] || []).filter(a => a.horaInicio?.substring(0, 5) === hora);
              return (
                <div
                  key={di}
                  className={`border-r border-gray-100 last:border-r-0 p-1 cursor-pointer hover:bg-orange-50 transition-colors ${isToday ? 'bg-orange-50/30' : ''}`}
                  onClick={() => openNew(ds, hora)}
                >
                  {citasHora.map(appt => {
                    const cfg = ESTADO_CONFIG[appt.estado] || ESTADO_CONFIG.programada;
                    return (
                      <div
                        key={appt.id}
                        className={`rounded-lg p-1.5 mb-1 border-l-4 text-xs cursor-pointer hover:opacity-80 transition-opacity ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        style={{ borderLeftColor: appt.color || '#f97316' }}
                        onClick={e => { e.stopPropagation(); openEdit(appt); }}
                      >
                        <p className="font-bold truncate">{appt.titulo}</p>
                        {appt.cliente && <p className="truncate opacity-80">{appt.cliente}</p>}
                        <p className="opacity-70">{formatHora(appt.horaInicio?.substring(0, 5))}{appt.horaFin ? ` - ${formatHora(appt.horaFin?.substring(0, 5))}` : ''}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Vista Lista ───────────────────────────────────────────────────────────
  const renderLista = () => {
    const allAppts = (appointments as any[]).sort((a, b) => {
      const fa = (a.fecha?.split('T')[0] || '') + a.horaInicio;
      const fb = (b.fecha?.split('T')[0] || '') + b.horaInicio;
      return fa.localeCompare(fb);
    });

    if (allAppts.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay citas esta semana</p>
          <p className="text-sm mt-1">Haz clic en "+ Nueva Cita" para agregar</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {allAppts.map(appt => {
          const cfg = ESTADO_CONFIG[appt.estado] || ESTADO_CONFIG.programada;
          const fechaD = new Date(appt.fecha + 'T00:00:00');
          return (
            <div key={appt.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
              {/* Fecha */}
              <div className="text-center min-w-[48px]">
                <p className="text-xs text-gray-400">{DIAS_SEMANA[fechaD.getDay()]}</p>
                <p className="text-2xl font-bold text-gray-800">{fechaD.getDate()}</p>
              </div>
              {/* Color bar */}
              <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: appt.color || '#f97316' }} />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{appt.titulo}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatHora(appt.horaInicio?.substring(0, 5))}{appt.horaFin ? ` - ${formatHora(appt.horaFin?.substring(0, 5))}` : ''}</span>
                  {appt.cliente && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{appt.cliente}</span>}
                  {appt.telefono && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{appt.telefono}</span>}
                  {appt.dispositivo && <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" />{appt.dispositivo}</span>}
                  {appt.tecnico && <span className="flex items-center gap-1 text-orange-600 font-medium">🔧 {appt.tecnico}</span>}
                </div>
                {appt.descripcion && <p className="text-xs text-gray-400 mt-1 truncate">{appt.descripcion}</p>}
              </div>
              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(appt)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors" title="Editar">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteMutation.mutate({ id: appt.id })} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-orange-500" />
              Agenda de Citas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Semana del {weekDates[0].toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })} al {weekDates[6].toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Navegación */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={prevWeek} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToday} className="px-3 h-8 rounded-lg hover:bg-white text-sm font-medium transition-colors">
                Hoy
              </button>
              <button onClick={nextWeek} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {/* Vista */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {(['semana', 'lista'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className={`px-3 h-8 rounded-lg text-sm font-medium transition-colors capitalize ${viewMode === v ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {v === 'semana' ? 'Semana' : 'Lista'}
                </button>
              ))}
            </div>
            <Button onClick={() => openNew(dateToStr(currentDate))} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => {
            const count = (appointments as any[]).filter(a => a.estado === key).length;
            return (
              <div key={key} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
                <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                <p className={`text-2xl font-bold mt-1 ${cfg.text}`}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Calendario */}
        <Card className="overflow-hidden border-gray-200">
          {viewMode === 'semana' ? renderSemana() : renderLista()}
        </Card>
      </div>

      {/* Dialog Nueva/Editar Cita */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditingAppointment(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
            <DialogDescription>Completa los datos de la cita o servicio programado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Título */}
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Reparación pantalla iPhone 14" className="mt-1" />
            </div>

            {/* Fecha y horas */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inicio *</Label>
                <Input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fin</Label>
                <Input type="time" value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))} className="mt-1" />
              </div>
            </div>

            {/* Cliente y teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cliente</Label>
                <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nombre del cliente" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="(555) 000-0000" className="mt-1" />
              </div>
            </div>

            {/* Dispositivo y técnico */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dispositivo</Label>
                <Input value={form.dispositivo} onChange={e => setForm(f => ({ ...f, dispositivo: e.target.value }))} placeholder="iPhone 14, Samsung S23..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Técnico</Label>
                <Select value={form.tecnico} onValueChange={v => setForm(f => ({ ...f, tecnico: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Asignar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {(tecnicos as any[]).map(t => (
                      <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estado y color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {COLORES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalle del servicio a realizar..." className="mt-1 resize-none" rows={2} />
            </div>

            {/* Notas */}
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notas internas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Notas para el equipo..." className="mt-1 resize-none" rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Check className="h-4 w-4" />
                {editingAppointment ? 'Guardar Cambios' : 'Crear Cita'}
              </Button>
              {editingAppointment && (
                <Button variant="outline" onClick={() => { if (confirm('¿Eliminar esta cita?')) { deleteMutation.mutate({ id: editingAppointment.id }); setDialogOpen(false); } }} className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingAppointment(null); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
