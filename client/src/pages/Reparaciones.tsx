import { useState, useMemo, useEffect } from 'react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import {
  Wrench, Plus, DollarSign, Clock, CheckCircle, Package, Trash2,
  FileText, Search, X, User, Phone, Smartphone, Shield, ShieldOff,
  Printer, UserCog, Lock, Camera, ImageIcon, AlertTriangle,
  ChevronRight, ChevronLeft, CheckSquare, ArrowRight
} from 'lucide-react';
import { FacturaReparacion } from '@/components/FacturaReparacion';
import { toast } from 'sonner';

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface ParteSeleccionada {
  id: string;
  partId?: number;
  esExterna: boolean;
  nombre: string;
  cantidad: number;
  costoUnitario: string;
  cantidadDisponible?: number;
}

type ChecklistEstado = 'ok' | 'falla' | 'no_aplica';
interface ChecklistItem { id: string; estado: ChecklistEstado; }

interface RepairSummary {
  codigo: string;
  cliente: string;
  dispositivo: string;
  precioTotal: number;
  manoDeObra: number;
}

// ─── Checklist de Diagnóstico ───────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { id: 'pantalla',       label: 'Pantalla',        icon: '📱', color: 'blue' },
  { id: 'tactil',         label: 'Táctil',           icon: '👆', color: 'blue' },
  { id: 'boton_home',     label: 'Botón Home',       icon: '⭕', color: 'gray' },
  { id: 'boton_power',    label: 'Botón Power',      icon: '🔴', color: 'gray' },
  { id: 'botones_volumen',label: 'Volumen',          icon: '🔊', color: 'gray' },
  { id: 'camara_trasera', label: 'Cámara Trasera',   icon: '📷', color: 'purple' },
  { id: 'camara_frontal', label: 'Cámara Frontal',   icon: '🤳', color: 'purple' },
  { id: 'altavoz',        label: 'Altavoz',          icon: '🔈', color: 'orange' },
  { id: 'microfono',      label: 'Micrófono',        icon: '🎤', color: 'orange' },
  { id: 'auricular',      label: 'Auricular',        icon: '👂', color: 'orange' },
  { id: 'carga',          label: 'Puerto Carga',     icon: '🔌', color: 'yellow' },
  { id: 'bateria',        label: 'Batería',          icon: '🔋', color: 'yellow' },
  { id: 'wifi',           label: 'Wi-Fi',            icon: '📶', color: 'teal' },
  { id: 'bluetooth',      label: 'Bluetooth',        icon: '🔵', color: 'teal' },
  { id: 'sim',            label: 'Lector SIM',       icon: '💳', color: 'teal' },
  { id: 'huella',         label: 'Huella Digital',   icon: '🖐️', color: 'green' },
  { id: 'face_id',        label: 'Face ID',          icon: '😊', color: 'green' },
  { id: 'carcasa',        label: 'Carcasa/Chasis',   icon: '🛡️', color: 'red' },
];

// ─── Orden de Trabajo (ventana de impresión) ───────────────────────────────
function imprimirOrdenTrabajo(repair: any) {
  const garantiaVence = repair.garantiaVence
    ? new Date(repair.garantiaVence).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : repair.garantiaDias
      ? (() => {
          const d = new Date(repair.fechaIngreso);
          d.setDate(d.getDate() + (repair.garantiaDias || 30));
          return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        })()
      : 'N/A';

  let checklistItems: { id: string; estado: string }[] = [];
  let imagenes: string[] = [];
  try {
    if (repair.checklistComponentes) checklistItems = JSON.parse(repair.checklistComponentes);
    if (repair.imagenesDispositivo) imagenes = JSON.parse(repair.imagenesDispositivo);
  } catch { /* ignorar */ }

  const CHECKLIST_LABELS: Record<string, string> = {
    pantalla: 'Pantalla', tactil: 'Táctil', boton_home: 'Botón Home', boton_power: 'Botón Power',
    botones_volumen: 'Botones Volumen', camara_trasera: 'Cámara Trasera', camara_frontal: 'Cámara Frontal',
    altavoz: 'Altavoz', microfono: 'Micrófono', auricular: 'Auricular', carga: 'Puerto de Carga',
    bateria: 'Batería', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', sim: 'Lector SIM',
    huella: 'Lector de Huella', face_id: 'Face ID', carcasa: 'Carcasa/Chasis',
  };

  const checklistHtml = checklistItems.length > 0 ? `
  <div class="problem-box" style="margin-bottom:12px">
    <div class="section-title">Checklist de Componentes al Ingreso</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px">
      ${checklistItems.map(c => `
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:3px 6px;border-radius:4px;background:${c.estado === 'ok' ? '#f0fdf4' : c.estado === 'falla' ? '#fef2f2' : '#f9fafb'};border:1px solid ${c.estado === 'ok' ? '#86efac' : c.estado === 'falla' ? '#fca5a5' : '#e5e7eb'}">
          <span style="font-weight:700;color:${c.estado === 'ok' ? '#15803d' : c.estado === 'falla' ? '#dc2626' : '#9ca3af'}">${c.estado === 'ok' ? '✓' : c.estado === 'falla' ? '✗' : '—'}</span>
          <span style="color:#374151">${CHECKLIST_LABELS[c.id] || c.id}</span>
        </div>`).join('')}
    </div>
  </div>` : '';

  const imagenesHtml = imagenes.length > 0 ? `
  <div class="problem-box" style="margin-bottom:12px">
    <div class="section-title">Fotos del Dispositivo al Ingreso</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
      ${imagenes.map(url => `<img src="${url}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;border:1px solid #ddd" />`).join('')}
    </div>
  </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Orden de Trabajo ${repair.codigo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
    .header h2 { font-size: 13px; font-weight: 600; color: #555; }
    .badge { display: inline-block; background: #f97316; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 14px; font-weight: 700; margin-top: 6px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .section { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .label { color: #666; }
    .value { font-weight: 600; text-align: right; max-width: 60%; }
    .problem-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .problem-box p { margin-top: 4px; line-height: 1.5; }
    .garantia { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .garantia-title { color: #15803d; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .firma-line { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 11px; color: #555; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>FIXOPOLIS SOLUTIONS</h1>
    <h2>Orden de Trabajo — Reparación</h2>
    <div class="badge">${repair.codigo}</div>
  </div>
  <div class="grid2">
    <div class="section">
      <div class="section-title">Datos del Cliente</div>
      <div class="row"><span class="label">Nombre:</span><span class="value">${repair.cliente || '—'}</span></div>
      <div class="row"><span class="label">Teléfono:</span><span class="value">${repair.telefono || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Datos del Equipo</div>
      <div class="row"><span class="label">Dispositivo:</span><span class="value">${repair.dispositivo || '—'}</span></div>
      <div class="row"><span class="label">Fecha Ingreso:</span><span class="value">${new Date(repair.fechaIngreso).toLocaleDateString('es-MX')}</span></div>
      <div class="row"><span class="label">Técnico:</span><span class="value">${repair.tecnico || 'Sin asignar'}</span></div>
    </div>
  </div>
  <div class="problem-box">
    <div class="section-title">Problema Reportado</div>
    <p>${repair.problema || '—'}</p>
  </div>
  ${repair.diagnostico ? `<div class="problem-box"><div class="section-title">Diagnóstico Técnico</div><p>${repair.diagnostico}</p></div>` : ''}
  ${repair.notas ? `<div class="problem-box"><div class="section-title">Notas Adicionales</div><p>${repair.notas}</p></div>` : ''}
  ${checklistHtml}
  ${imagenesHtml}
  <div class="grid2">
    <div class="section">
      <div class="section-title">Costos</div>
      <div class="row"><span class="label">Costo Partes:</span><span class="value">$${Number(repair.costoPartes || 0).toFixed(2)}</span></div>
      <div class="row"><span class="label">Mano de Obra:</span><span class="value">$${Number(repair.precioManoObra || 0).toFixed(2)}</span></div>
      <div class="row" style="border-top:1px solid #eee;padding-top:4px;margin-top:4px">
        <span class="label"><strong>Total:</strong></span>
        <span class="value"><strong>$${Number(repair.precioTotal || 0).toFixed(2)}</strong></span>
      </div>
    </div>
    <div class="garantia">
      <div class="garantia-title">🛡 Garantía</div>
      <div class="row" style="margin-top:6px"><span class="label">Días:</span><span class="value">${repair.garantiaDias || 30} días</span></div>
      <div class="row"><span class="label">Vence:</span><span class="value">${garantiaVence}</span></div>
      <p style="font-size:10px;color:#555;margin-top:6px">La garantía cubre el defecto reparado bajo uso normal. No aplica a daños por agua, golpes o mal uso.</p>
    </div>
  </div>
  <div class="firmas">
    <div class="firma-line">Firma del Técnico</div>
    <div class="firma-line">Firma del Cliente</div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Wizard Step Indicator ─────────────────────────────────────────────────
function WizardSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Cliente', icon: User },
    { num: 2, label: 'Dispositivo', icon: Smartphone },
    { num: 3, label: 'Costos', icon: DollarSign },
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.num;
        const isDone = currentStep > step.num;
        return (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                isDone ? 'bg-green-500 text-white' :
                isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-orange-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-5 transition-all ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function Reparaciones() {
  const { user } = useAuth();

  // Dialog y wizard
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Datos del formulario (wizard)
  const [formData, setFormData] = useState({
    cliente: '', telefono: '', problema: '', diagnostico: '', notas: '',
    dispositivo: '', codigoDesbloqueo: '', tecnico: '', garantiaDias: '30',
    fechaIngreso: new Date().toISOString().split('T')[0],
  });

  // Otros estados
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'completada' | 'entregada'>('todos');
  const [facturaDialogOpen, setFacturaDialogOpen] = useState(false);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [partesSeleccionadas, setPartesSeleccionadas] = useState<ParteSeleccionada[]>([]);
  const [siguienteCodigo, setSiguienteCodigo] = useState('REP-001');
  const [precioTotal, setPrecioTotal] = useState<number>(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [repairSummary, setRepairSummary] = useState<RepairSummary | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map(item => ({ id: item.id, estado: 'no_aplica' as ChecklistEstado }))
  );
  const [imagenesDispositivo, setImagenesDispositivo] = useState<string[]>([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Queries
  const { data: repairs = [], refetch } = trpc.repairs.list.useQuery();
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const { data: nextCodeData } = trpc.repairs.getNextCode.useQuery();

  useEffect(() => {
    if (nextCodeData?.codigo) setSiguienteCodigo(nextCodeData.codigo);
  }, [nextCodeData]);

  // Mutations
  const createMutation = trpc.repairs.create.useMutation({
    onSuccess: (result, variables) => {
      setRepairSummary({
        codigo: variables.codigo,
        cliente: variables.cliente || 'Sin nombre',
        dispositivo: variables.dispositivo || 'Sin dispositivo',
        precioTotal: parseFloat(variables.precioTotal),
        manoDeObra: parseFloat(variables.precioManoObra),
      });
      setSummaryOpen(true);
      refetch();
      setDialogOpen(false);
      resetForm();
      toast.success('Reparación registrada exitosamente');
    },
    onError: (error) => toast.error('Error al registrar: ' + error.message),
  });

  const updateMutation = trpc.repairs.update.useMutation({
    onSuccess: () => { toast.success('Reparación actualizada'); refetch(); },
    onError: (error) => toast.error('Error al actualizar: ' + error.message),
  });

  const deleteMutation = trpc.repairs.delete.useMutation({
    onSuccess: () => { toast.success('Reparación eliminada'); refetch(); },
    onError: (error) => toast.error('Error al eliminar: ' + error.message),
  });

  const resetForm = () => {
    setWizardStep(1);
    setFormData({
      cliente: '', telefono: '', problema: '', diagnostico: '', notas: '',
      dispositivo: '', codigoDesbloqueo: '', tecnico: '', garantiaDias: '30',
      fechaIngreso: new Date().toISOString().split('T')[0],
    });
    setPartesSeleccionadas([]);
    setPrecioTotal(0);
    setChecklist(CHECKLIST_ITEMS.map(item => ({ id: item.id, estado: 'no_aplica' as ChecklistEstado })));
    setImagenesDispositivo([]);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (itemId: string, estado: ChecklistEstado) => {
    setChecklist(prev => prev.map(c => c.id === itemId ? { ...c, estado } : c));
  };

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagenesDispositivo.length >= 6) { toast.error('Máximo 6 imágenes'); return; }
    setSubiendoImagen(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        const res = await fetch('/api/product-image/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
        });
        const data = await res.json();
        if (data.url) { setImagenesDispositivo(prev => [...prev, data.url]); toast.success('Foto agregada'); }
        setSubiendoImagen(false);
      };
      reader.readAsDataURL(file);
    } catch { toast.error('Error al subir imagen'); setSubiendoImagen(false); }
  };

  const costoTotalPartes = useMemo(() =>
    partesSeleccionadas.reduce((sum, p) => sum + (Number(p.costoUnitario) * p.cantidad), 0),
    [partesSeleccionadas]
  );

  const manoDeObra = useMemo(() => {
    const mano = precioTotal - costoTotalPartes;
    return mano >= 0 ? mano : 0;
  }, [precioTotal, costoTotalPartes]);

  useEffect(() => {
    if (precioTotal < costoTotalPartes) setPrecioTotal(costoTotalPartes + 50);
  }, [costoTotalPartes]);

  // Validación por paso
  const validateStep1 = () => {
    if (!formData.cliente.trim()) { toast.error('El nombre del cliente es requerido'); return false; }
    if (!formData.telefono.trim()) { toast.error('El teléfono es requerido'); return false; }
    if (!formData.problema.trim()) { toast.error('Describe el problema reportado'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dispositivo.trim()) { toast.error('El modelo del dispositivo es requerido'); return false; }
    return true;
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && !validateStep1()) return;
    if (wizardStep === 2 && !validateStep2()) return;
    setWizardStep(prev => prev + 1);
  };

  const handleSubmit = () => {
    for (const parte of partesSeleccionadas) {
      if (parte.esExterna && !parte.nombre.trim()) { toast.error('Todas las partes externas deben tener un nombre'); return; }
      if (!parte.esExterna && parte.cantidadDisponible !== undefined && parte.cantidad > parte.cantidadDisponible) {
        toast.error(`Stock insuficiente para ${parte.nombre}`); return;
      }
    }

    const partesParaBackend = partesSeleccionadas.map(p => {
      const parte: any = { cantidad: p.cantidad };
      if (p.esExterna) { parte.nombre = p.nombre; parte.costoUnitario = p.costoUnitario; }
      else { parte.partId = p.partId; }
      return parte;
    });

    const checklistFiltrado = checklist.filter(c => c.estado !== 'no_aplica');

    createMutation.mutate({
      codigo: siguienteCodigo,
      cliente: formData.cliente,
      telefono: formData.telefono,
      dispositivo: formData.dispositivo,
      problema: formData.problema,
      diagnostico: formData.diagnostico || undefined,
      precioManoObra: manoDeObra.toFixed(2),
      precioTotal: precioTotal.toFixed(2),
      fechaIngreso: formData.fechaIngreso,
      notas: formData.notas || undefined,
      tecnico: formData.tecnico || undefined,
      garantiaDias: parseInt(formData.garantiaDias) || 30,
      codigoDesbloqueo: formData.codigoDesbloqueo || undefined,
      checklistComponentes: checklistFiltrado.length > 0 ? JSON.stringify(checklistFiltrado) : undefined,
      imagenesDispositivo: imagenesDispositivo.length > 0 ? JSON.stringify(imagenesDispositivo) : undefined,
      partes: partesParaBackend.length > 0 ? partesParaBackend : undefined,
    });
  };

  const handleAgregarParteInventario = (partId: number) => {
    const parte = parts.find(p => p.id === partId);
    if (!parte) return;
    setPartesSeleccionadas([...partesSeleccionadas, {
      id: `inv-${Date.now()}-${Math.random()}`,
      partId: parte.id, esExterna: false,
      nombre: parte.nombre, cantidad: 1,
      costoUnitario: parte.precioCompraUnitario,
      cantidadDisponible: parte.cantidadActual,
    }]);
  };

  const handleAgregarParteExterna = () => {
    setPartesSeleccionadas([...partesSeleccionadas, {
      id: `ext-${Date.now()}-${Math.random()}`,
      esExterna: true, nombre: '', cantidad: 1, costoUnitario: '0.00',
    }]);
  };

  const handleEliminarParte = (id: string) => setPartesSeleccionadas(partesSeleccionadas.filter(p => p.id !== id));

  const handleActualizarParte = (id: string, campo: keyof ParteSeleccionada, valor: any) => {
    setPartesSeleccionadas(partesSeleccionadas.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  // Filtros
  const repairsFiltradas = useMemo(() => {
    let filtered = repairs;
    if (filtroEstado !== 'todos') filtered = filtered.filter(r => r.estado === filtroEstado);
    if (busqueda.trim()) {
      const search = busqueda.toLowerCase();
      filtered = filtered.filter(r =>
        r.cliente?.toLowerCase().includes(search) ||
        r.telefono?.includes(search) ||
        r.codigo?.toLowerCase().includes(search) ||
        r.dispositivo?.toLowerCase().includes(search) ||
        (r as any).tecnico?.toLowerCase().includes(search)
      );
    }
    if (fechaInicio) filtered = filtered.filter(r => new Date(r.fechaIngreso) >= new Date(fechaInicio));
    if (fechaFin) {
      const fin = new Date(fechaFin); fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.fechaIngreso) <= fin);
    }
    return filtered;
  }, [repairs, filtroEstado, busqueda, fechaInicio, fechaFin]);

  const totales = useMemo(() => ({
    pendientes: repairs.filter(r => r.estado === 'pendiente').length,
    enProceso: repairs.filter(r => r.estado === 'en_proceso').length,
    completadas: repairs.filter(r => r.estado === 'completada' || r.estado === 'entregada').length,
    gananciaTotal: repairs.filter(r => r.estado === 'completada' || r.estado === 'entregada').reduce((s, r) => s + Number(r.ganancia), 0),
    total: repairs.length,
  }), [repairs]);

  const handleUpdateEstado = (id: number, nuevoEstado: string) => {
    const updateData: any = { id, estado: nuevoEstado as any };
    if (nuevoEstado === 'completada') updateData.fechaCompletado = new Date().toISOString();
    else if (nuevoEstado === 'entregada') updateData.fechaEntrega = new Date().toISOString();
    updateMutation.mutate(updateData);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar esta reparación?')) deleteMutation.mutate({ id });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; dot: string; text: string }> = {
      pendiente:  { bg: 'bg-gray-100',   dot: 'bg-gray-400',   text: 'text-gray-700' },
      en_proceso: { bg: 'bg-yellow-100', dot: 'bg-yellow-500', text: 'text-yellow-800' },
      completada: { bg: 'bg-green-100',  dot: 'bg-green-500',  text: 'text-green-800' },
      entregada:  { bg: 'bg-blue-100',   dot: 'bg-blue-500',   text: 'text-blue-800' },
    };
    return badges[estado] || { bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'text-gray-700' };
  };

  const getEstadoTexto = (estado: string) => ({
    pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', entregada: 'Entregada',
  }[estado] || estado);

  const getGarantiaStatus = (repair: any) => {
    if (!repair.garantiaVence && !repair.garantiaDias) return null;
    if (repair.estado !== 'entregada' && repair.estado !== 'completada') return null;
    let vence: Date;
    if (repair.garantiaVence) { vence = new Date(repair.garantiaVence); }
    else { vence = new Date(repair.fechaIngreso); vence.setDate(vence.getDate() + (repair.garantiaDias || 30)); }
    const hoy = new Date();
    return { activa: vence >= hoy, diasRestantes: Math.ceil((vence.getTime() - hoy.getTime()) / 86400000) };
  };

  const hayFiltrosActivos = busqueda || filtroEstado !== 'todos' || fechaInicio || fechaFin;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reparaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona las órdenes de reparación</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200">
                <Plus className="h-4 w-4 mr-2" />Nueva Reparación
              </Button>
            </DialogTrigger>

            {/* ─── WIZARD DIALOG ─── */}
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
              {/* Header del wizard */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 pt-7 pb-6 rounded-t-lg">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-white">Nueva Reparación</h2>
                    <p className="text-orange-100 text-sm mt-0.5">Código: <span className="font-bold">{siguienteCodigo}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-100 text-xs">Paso {wizardStep} de 3</p>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3].map(s => (
                        <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= wizardStep ? 'bg-white' : 'bg-orange-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <WizardSteps currentStep={wizardStep} />

                {/* ─── PASO 1: Información del Cliente ─── */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <User className="h-7 w-7 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Información del Cliente</h3>
                      <p className="text-sm text-gray-500">¿Quién trae el dispositivo a reparar?</p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Nombre Completo *</Label>
                        <Input
                          value={formData.cliente}
                          onChange={(e) => updateField('cliente', e.target.value)}
                          placeholder="Ej: Juan Pérez García"
                          className="h-11 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Teléfono *</Label>
                        <Input
                          value={formData.telefono}
                          onChange={(e) => updateField('telefono', e.target.value)}
                          placeholder="Ej: 555-123-4567"
                          className="h-11 text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Fecha de Ingreso</Label>
                        <Input
                          type="date"
                          value={formData.fechaIngreso}
                          onChange={(e) => updateField('fechaIngreso', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Técnico Asignado</Label>
                        <Input
                          value={formData.tecnico}
                          onChange={(e) => updateField('tecnico', e.target.value)}
                          placeholder="Nombre del técnico"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Problema Reportado *</Label>
                      <Textarea
                        value={formData.problema}
                        onChange={(e) => updateField('problema', e.target.value)}
                        placeholder="Describe con detalle el problema que reporta el cliente..."
                        className="min-h-[100px] text-base resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Diagnóstico Técnico <span className="font-normal text-gray-400">(opcional)</span></Label>
                      <Textarea
                        value={formData.diagnostico}
                        onChange={(e) => updateField('diagnostico', e.target.value)}
                        placeholder="Diagnóstico inicial del técnico..."
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ─── PASO 2: Dispositivo + Checklist ─── */}
                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Smartphone className="h-7 w-7 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Información del Dispositivo</h3>
                      <p className="text-sm text-gray-500">Registra el equipo y su estado al ingreso</p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Modelo del Dispositivo *</Label>
                        <Input
                          value={formData.dispositivo}
                          onChange={(e) => updateField('dispositivo', e.target.value)}
                          placeholder="Ej: iPhone 14 Pro, Samsung S23..."
                          className="h-11 text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Días de Garantía</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.garantiaDias}
                          onChange={(e) => updateField('garantiaDias', e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Código de desbloqueo */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <Label className="text-sm font-bold text-amber-800">Código de Desbloqueo</Label>
                        <span className="text-xs text-amber-500 font-normal">(PIN, patrón o contraseña)</span>
                      </div>
                      <Input
                        value={formData.codigoDesbloqueo}
                        onChange={(e) => updateField('codigoDesbloqueo', e.target.value)}
                        placeholder="Ej: 1234, patrón en L, sin código..."
                        className="bg-white h-11"
                      />
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Información confidencial — solo visible para el técnico asignado.
                      </p>
                    </div>

                    {/* Checklist de componentes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                          Checklist de Componentes
                        </Label>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            ✓ {checklist.filter(c => c.estado === 'ok').length} OK
                          </span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            ✗ {checklist.filter(c => c.estado === 'falla').length} Fallas
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Marca el estado de cada componente al recibir el dispositivo. Protege al negocio de reclamos futuros.</p>
                      <div className="grid grid-cols-3 gap-2">
                        {CHECKLIST_ITEMS.map(item => {
                          const estado = checklist.find(c => c.id === item.id)?.estado || 'no_aplica';
                          return (
                            <div key={item.id} className={`rounded-xl border-2 p-3 transition-all ${
                              estado === 'ok' ? 'border-green-300 bg-green-50' :
                              estado === 'falla' ? 'border-red-300 bg-red-50' :
                              'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-base">{item.icon}</span>
                                <span className="text-xs font-semibold text-gray-700 leading-tight">{item.label}</span>
                              </div>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => handleChecklistChange(item.id, 'ok')}
                                  className={`flex-1 text-xs py-1 rounded-lg font-bold transition-all ${estado === 'ok' ? 'bg-green-500 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-green-100 border border-gray-200'}`}>
                                  OK
                                </button>
                                <button type="button" onClick={() => handleChecklistChange(item.id, 'falla')}
                                  className={`flex-1 text-xs py-1 rounded-lg font-bold transition-all ${estado === 'falla' ? 'bg-red-500 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-red-100 border border-gray-200'}`}>
                                  Falla
                                </button>
                                <button type="button" onClick={() => handleChecklistChange(item.id, 'no_aplica')}
                                  className={`flex-1 text-xs py-1 rounded-lg font-bold transition-all ${estado === 'no_aplica' ? 'bg-gray-400 text-white shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200'}`}>
                                  N/A
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fotos del dispositivo */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Camera className="h-4 w-4 text-gray-600" />
                          Fotos del Dispositivo
                          <span className="text-xs font-normal text-gray-400">({imagenesDispositivo.length}/6)</span>
                        </Label>
                        <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          subiendoImagen || imagenesDispositivo.length >= 6
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}>
                          <input type="file" accept="image/*" className="hidden" onChange={handleSubirImagen} disabled={subiendoImagen || imagenesDispositivo.length >= 6} />
                          {subiendoImagen ? 'Subiendo...' : '+ Agregar Foto'}
                        </label>
                      </div>
                      {imagenesDispositivo.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {imagenesDispositivo.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover rounded-xl border-2 border-gray-200" />
                              <button type="button" onClick={() => setImagenesDispositivo(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-gray-400">
                          <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-40" />
                          <p className="text-xs">Agrega fotos del estado del dispositivo al recibirlo</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── PASO 3: Partes + Costos ─── */}
                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-7 w-7 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Partes y Costos</h3>
                      <p className="text-sm text-gray-500">Define las partes utilizadas y el precio final</p>
                    </div>

                    {/* Partes utilizadas */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-600" />
                          Partes Utilizadas
                        </Label>
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => handleAgregarParteInventario(Number(value))}>
                            <SelectTrigger className="h-8 text-xs w-44">
                              <SelectValue placeholder="Del inventario" />
                            </SelectTrigger>
                            <SelectContent>
                              {parts.map(part => (
                                <SelectItem key={part.id} value={part.id.toString()}>
                                  {part.nombre} ({part.cantidadActual})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="sm" onClick={handleAgregarParteExterna} className="h-8 text-xs">
                            <Plus className="h-3 w-3 mr-1" />Externa
                          </Button>
                        </div>
                      </div>

                      {partesSeleccionadas.length > 0 ? (
                        <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                          {partesSeleccionadas.map(parte => (
                            <div key={parte.id} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-gray-200">
                              {parte.esExterna ? (
                                <>
                                  <Input placeholder="Nombre de la parte" value={parte.nombre} onChange={(e) => handleActualizarParte(parte.id, 'nombre', e.target.value)} className="flex-1 h-8 text-sm" />
                                  <Input type="number" step="0.01" placeholder="Costo" value={parte.costoUnitario} onChange={(e) => handleActualizarParte(parte.id, 'costoUnitario', e.target.value)} className="w-24 h-8 text-sm" />
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm font-medium text-gray-700">{parte.nombre}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${parte.costoUnitario} c/u</span>
                                </>
                              )}
                              <Input type="number" min="1" value={parte.cantidad} onChange={(e) => handleActualizarParte(parte.id, 'cantidad', Number(e.target.value))} className="w-16 h-8 text-sm text-center" />
                              <span className="text-sm font-bold text-gray-900 w-20 text-right">${(Number(parte.costoUnitario) * parte.cantidad).toFixed(2)}</span>
                              <button type="button" onClick={() => handleEliminarParte(parte.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <div className="flex justify-end pt-1">
                            <span className="text-sm font-bold text-gray-700">Subtotal partes: <span className="text-orange-600">${costoTotalPartes.toFixed(2)}</span></span>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl py-5 text-center text-gray-400">
                          <Package className="h-7 w-7 mx-auto mb-1 opacity-40" />
                          <p className="text-xs">Sin partes — agrega del inventario o externas</p>
                        </div>
                      )}
                    </div>

                    {/* Precio total */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">Precio Total al Cliente *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={precioTotal.toFixed(2)}
                            onChange={(e) => setPrecioTotal(parseFloat(e.target.value) || 0)}
                            className="pl-8 h-14 text-2xl font-bold text-gray-900 bg-white border-2 border-gray-200 focus:border-orange-400"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Costo Partes</p>
                          <p className="text-lg font-bold text-gray-800">${costoTotalPartes.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-green-200 bg-green-50">
                          <p className="text-xs text-green-600 mb-1">Mano de Obra</p>
                          <p className="text-lg font-bold text-green-700">${manoDeObra.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-orange-200 bg-orange-50">
                          <p className="text-xs text-orange-600 mb-1">Ganancia</p>
                          <p className="text-lg font-bold text-orange-700">${manoDeObra.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Notas Adicionales <span className="font-normal text-gray-400">(opcional)</span></Label>
                      <Textarea
                        value={formData.notas}
                        onChange={(e) => updateField('notas', e.target.value)}
                        placeholder="Observaciones adicionales sobre la reparación..."
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ─── Botones de navegación ─── */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => wizardStep === 1 ? setDialogOpen(false) : setWizardStep(prev => prev - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {wizardStep === 1 ? 'Cancelar' : 'Anterior'}
                  </Button>

                  {wizardStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 px-6"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={createMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 px-6"
                    >
                      {createMutation.isPending ? 'Guardando...' : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Guardar Reparación
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tarjeta Resumen post-creación */}
        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                ¡Reparación Registrada!
              </DialogTitle>
            </DialogHeader>
            {repairSummary && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-green-200 pb-2">
                    <span className="text-sm text-gray-600">Código:</span>
                    <span className="font-bold text-lg text-green-700">{repairSummary.codigo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><User className="h-3.5 w-3.5" /> Cliente:</span>
                    <span className="font-medium">{repairSummary.cliente}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Dispositivo:</span>
                    <span className="font-medium">{repairSummary.dispositivo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Total:</span>
                    <span className="font-bold text-green-700">${repairSummary.precioTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setSummaryOpen(false)}>Cerrar</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Pendientes', value: totales.pendientes, icon: Clock, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-600', val: 'text-gray-900' },
            { label: 'En Proceso', value: totales.enProceso, icon: Wrench, color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-600', val: 'text-yellow-700' },
            { label: 'Completadas', value: totales.completadas, icon: CheckCircle, color: 'green', bg: 'bg-green-100', text: 'text-green-600', val: 'text-green-700' },
            { label: 'Ganancia Total', value: `$${totales.gananciaTotal.toFixed(2)}`, icon: DollarSign, color: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', val: 'text-orange-700' },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.text}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.val}`}>{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="p-4 border-0 shadow-sm bg-white">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por cliente, teléfono, código, dispositivo o técnico..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9 h-9 bg-gray-50 border-gray-200" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'pendiente', 'en_proceso', 'completada', 'entregada'] as const).map(estado => (
                <button key={estado} onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroEstado === estado ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {estado === 'todos' ? 'Todos' : estado === 'en_proceso' ? 'En Proceso' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9 bg-gray-50 border-gray-200 w-36" />
              <span className="text-gray-400 text-sm">—</span>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9 bg-gray-50 border-gray-200 w-36" />
            </div>
            {hayFiltrosActivos && (
              <button onClick={() => { setBusqueda(''); setFiltroEstado('todos'); setFechaInicio(''); setFechaFin(''); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap">
                <X className="h-3.5 w-3.5" />Limpiar
              </button>
            )}
          </div>
        </Card>

        {/* Tabla de Reparaciones */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          {repairsFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay reparaciones que mostrar</p>
              <p className="text-gray-400 text-sm mt-1">Ajusta los filtros o crea una nueva reparación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dispositivo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Técnico</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Checklist</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Garantía</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repairsFiltradas.map((repair) => {
                    const badge = getEstadoBadge(repair.estado);
                    const garantia = getGarantiaStatus(repair);
                    return (
                      <tr key={repair.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-orange-600 text-sm">{repair.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{repair.cliente || 'Sin nombre'}</p>
                            <p className="text-xs text-gray-400">{repair.telefono || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-700">{repair.dispositivo || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(repair as any).tecnico ? (
                            <span className="text-sm text-gray-700 flex items-center gap-1">
                              <UserCog className="h-3.5 w-3.5 text-gray-400" />{(repair as any).tecnico}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Select value={repair.estado} onValueChange={(value) => handleUpdateEstado(repair.id, value)}>
                            <SelectTrigger className="w-auto h-7 border-0 p-0 bg-transparent focus:ring-0">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                {getEstadoTexto(repair.estado)}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_proceso">En Proceso</SelectItem>
                              <SelectItem value="completada">Completada</SelectItem>
                              <SelectItem value="entregada">Entregada</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {(() => {
                            let cl: { id: string; estado: string }[] = [];
                            try { if ((repair as any).checklistComponentes) cl = JSON.parse((repair as any).checklistComponentes); } catch {}
                            const fallas = cl.filter(c => c.estado === 'falla').length;
                            const oks = cl.filter(c => c.estado === 'ok').length;
                            const imgs = (() => { try { return JSON.parse((repair as any).imagenesDispositivo || '[]').length; } catch { return 0; } })();
                            if (cl.length === 0 && imgs === 0) return <span className="text-xs text-gray-400">—</span>;
                            return (
                              <div className="flex flex-col gap-0.5">
                                {cl.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {fallas > 0 && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">✗ {fallas}</span>}
                                    {oks > 0 && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓ {oks}</span>}
                                  </div>
                                )}
                                {imgs > 0 && <span className="text-xs text-blue-600 flex items-center gap-0.5"><Camera className="h-3 w-3" />{imgs}</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {garantia ? (
                            garantia.activa ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Shield className="h-3 w-3" />{garantia.diasRestantes}d
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                <ShieldOff className="h-3 w-3" />Vencida
                              </span>
                            )
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div>
                            <p className="text-sm font-bold text-gray-900">${Number(repair.precioTotal).toFixed(2)}</p>
                            <p className="text-xs text-green-600">+${Number(repair.ganancia).toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => imprimirOrdenTrabajo(repair)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors" title="Imprimir orden">
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { setReparacionSeleccionada(repair); setFacturaDialogOpen(true); }} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors" title="Ver recibo">
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(repair.id)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Eliminar">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">Mostrando {repairsFiltradas.length} de {repairs.length} reparaciones</p>
              </div>
            </div>
          )}
        </Card>

        {/* Dialog de Factura */}
        <Dialog open={facturaDialogOpen} onOpenChange={setFacturaDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recibo de Reparación</DialogTitle>
            </DialogHeader>
            {reparacionSeleccionada && <FacturaReparacion repair={reparacionSeleccionada} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
