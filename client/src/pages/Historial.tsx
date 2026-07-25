import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  History, Search, Filter, Pencil, Trash2, 
  TrendingUp, TrendingDown, Loader2, FileSpreadsheet, FileText,
  DollarSign, Landmark, Receipt, Wallet
} from 'lucide-react';

type PaymentMethod = 'efectivo' | 'banco';

interface Transaction {
  id: number;
  tipo: 'ingreso' | 'gasto';
  monto: string;
  metodo: 'efectivo' | 'banco';
  descripcion: string | null;
  categoria: string | null;
  proveedor: string | null;
  tienda: 'admin';
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function Historial() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterMetodo, setFilterMetodo] = useState<string>('todos');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  
  // Estados para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editMonto, setEditMonto] = useState('');
  const [editMetodo, setEditMetodo] = useState<PaymentMethod>('efectivo');
  const [editDescripcion, setEditDescripcion] = useState('');
  
  // Estado para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const utils = trpc.useUtils();
  
  // Query para obtener configuración
  const { data: configData = {} } = trpc.config.getAll.useQuery();
  
  // Query para obtener todas las transacciones
  const { data: transacciones = [], isLoading } = trpc.transactions.list.useQuery({
    tienda: 'admin',
  });

  // Mutations
  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Transacción actualizada exitosamente');
      setEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast.error('Error al actualizar la transacción');
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Transacción eliminada exitosamente');
      setDeleteDialogOpen(false);
      setDeletingTransaction(null);
    },
    onError: () => {
      toast.error('Error al eliminar la transacción');
    },
  });

  // Filtrar transacciones
  const filteredTransactions = useMemo(() => {
    return transacciones.filter(t => {
      // Filtro por búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchDescripcion = t.descripcion?.toLowerCase().includes(search);
        const matchCategoria = t.categoria?.toLowerCase().includes(search);
        const matchProveedor = t.proveedor?.toLowerCase().includes(search);
        if (!matchDescripcion && !matchCategoria && !matchProveedor) return false;
      }
      
      // Filtro por tipo
      if (filterTipo !== 'todos' && t.tipo !== filterTipo) return false;
      
      // Filtro por método
      if (filterMetodo !== 'todos' && t.metodo !== filterMetodo) return false;
      
      // Filtro por fecha inicio
      if (filterFechaInicio) {
        const fechaInicio = new Date(filterFechaInicio);
        const fechaTransaccion = new Date(t.fecha);
        if (fechaTransaccion < fechaInicio) return false;
      }
      
      // Filtro por fecha fin
      if (filterFechaFin) {
        const fechaFin = new Date(filterFechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        const fechaTransaccion = new Date(t.fecha);
        if (fechaTransaccion > fechaFin) return false;
      }
      
      return true;
    });
  }, [transacciones, searchTerm, filterTipo, filterMetodo, filterFechaInicio, filterFechaFin]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTipo('todos');
    setFilterMetodo('todos');
    setFilterFechaInicio('');
    setFilterFechaFin('');
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditMonto(transaction.monto.toString());
    setEditMetodo(transaction.metodo);
    setEditDescripcion(transaction.descripcion || '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingTransaction || !editMonto || parseFloat(editMonto) <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    updateMutation.mutate({
      id: editingTransaction.id,
      monto: editMonto,
      metodo: editMetodo,
      descripcion: editDescripcion || undefined,
    });
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingTransaction) return;
    deleteMutation.mutate({ id: deletingTransaction.id });
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Monto', 'Método', 'Categoría', 'Descripción'];
    const rows = filteredTransactions.map(t => [
      new Date(t.fecha).toLocaleDateString('es-MX'),
      t.tipo,
      parseFloat(t.monto).toFixed(2),
      t.metodo,
      t.categoria || '',
      t.descripcion || ''
    ]);
    
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo CSV exportado');
  };

  // Exportar a Excel (formato básico)
  const exportToExcel = () => {
    const headers = ['Fecha', 'Tipo', 'Monto', 'Método', 'Categoría', 'Descripción'];
    const rows = filteredTransactions.map(t => [
      new Date(t.fecha).toLocaleDateString('es-MX'),
      t.tipo,
      parseFloat(t.monto).toFixed(2),
      t.metodo,
      t.categoria || '',
      t.descripcion || ''
    ]);
    
    // Crear contenido HTML para Excel
    let html = '<html><head><meta charset="UTF-8"></head><body>';
    html += '<table border="1">';
    html += '<tr>' + headers.map(h => `<th style="background:#4CAF50;color:white;padding:8px">${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      const tipo = row[1];
      const bgColor = tipo === 'ingreso' ? '#E8F5E9' : '#FFEBEE';
      html += '<tr>' + row.map(cell => `<td style="background:${bgColor};padding:8px">${cell}</td>`).join('') + '</tr>';
    });
    html += '</table></body></html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo Excel exportado');
  };

  // Calcular totales con taxes y distribución inteligente
  const totales = useMemo(() => {
    const config = {
      taxRate: parseFloat(configData.taxRate || '8.25'),
      porcentajeAhorro: parseFloat(configData.porcentajeAhorro || '30'),
      porcentajeInversion: parseFloat(configData.porcentajeInversion || '20'),
      porcentajeEmergencia: parseFloat(configData.porcentajeEmergencia || '10'),
      porcentajeDisponible: parseFloat(configData.porcentajeDisponible || '40'),
    };

    const ingresosEfectivo = filteredTransactions
      .filter(t => t.tipo === 'ingreso' && t.metodo === 'efectivo')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);
    
    const ingresosBanco = filteredTransactions
      .filter(t => t.tipo === 'ingreso' && t.metodo === 'banco')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);
    
    const ingresos = ingresosEfectivo + ingresosBanco;
    
    const gastos = filteredTransactions
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);
    
    // Calcular taxes
    const taxEfectivo = ingresosEfectivo * (config.taxRate / 100);
    const taxBanco = ingresosBanco * (config.taxRate / 100);
    const totalTax = taxEfectivo + taxBanco;
    
    // Ingreso neto después de taxes
    const netoEfectivo = ingresosEfectivo - taxEfectivo;
    const netoBanco = ingresosBanco - taxBanco;
    
    // Calcular distribución inteligente sobre el neto
    const distribucionEfectivo = {
      ahorro: netoEfectivo * config.porcentajeAhorro / 100,
      inversion: netoEfectivo * config.porcentajeInversion / 100,
      emergencia: netoEfectivo * config.porcentajeEmergencia / 100,
      disponible: netoEfectivo * config.porcentajeDisponible / 100,
    };
    
    const distribucionBanco = {
      ahorro: netoBanco * config.porcentajeAhorro / 100,
      inversion: netoBanco * config.porcentajeInversion / 100,
      emergencia: netoBanco * config.porcentajeEmergencia / 100,
      disponible: netoBanco * config.porcentajeDisponible / 100,
    };
    
    return {
      ingresos,
      ingresosEfectivo,
      ingresosBanco,
      gastos,
      balance: ingresos - gastos,
      taxEfectivo,
      taxBanco,
      totalTax,
      taxRate: config.taxRate,
      netoEfectivo,
      netoBanco,
      distribucionEfectivo,
      distribucionBanco,
      porcentajes: config,
    };
  }, [filteredTransactions, configData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Historial</h1>
            <p className="text-muted-foreground mt-1">Consulta todas las transacciones</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Descripción, categoría..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ingreso">Ingresos</SelectItem>
                  <SelectItem value="gasto">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredTransactions.length} transacciones encontradas
            </span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </Card>

        {/* Resumen - Ingresos por Método */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Ingresos Efectivo</p>
                <p className="text-xl font-bold text-green-700">${totales.ingresosEfectivo.toFixed(2)}</p>
                <p className="text-xs text-green-600">Tax: ${totales.taxEfectivo.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Landmark className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Ingresos Banco</p>
                <p className="text-xl font-bold text-blue-700">${totales.ingresosBanco.toFixed(2)}</p>
                <p className="text-xs text-blue-600">Tax: ${totales.taxBanco.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600">Total Gastos</p>
                <p className="text-xl font-bold text-red-700">${totales.gastos.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">Taxes del Período</p>
                <p className="text-xl font-bold text-orange-700">${totales.totalTax.toFixed(2)}</p>
                <p className="text-xs text-orange-600">Tasa: {totales.taxRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Balance */}
        <Card className={`p-4 ${totales.balance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center gap-3">
            <History className={`h-8 w-8 ${totales.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <p className={`text-sm ${totales.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Balance del Período</p>
              <p className={`text-2xl font-bold ${totales.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                ${totales.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Distribución Inteligente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Distribución Efectivo (Neto: ${totales.netoEfectivo.toFixed(2)})
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Ahorro ({totales.porcentajes.porcentajeAhorro}%)</span>
                <span className="font-semibold text-green-700">${totales.distribucionEfectivo.ahorro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Inversión ({totales.porcentajes.porcentajeInversion}%)</span>
                <span className="font-semibold text-blue-700">${totales.distribucionEfectivo.inversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Emergencia ({totales.porcentajes.porcentajeEmergencia}%)</span>
                <span className="font-semibold text-orange-700">${totales.distribucionEfectivo.emergencia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Disponible ({totales.porcentajes.porcentajeDisponible}%)</span>
                <span className="font-semibold text-purple-700">${totales.distribucionEfectivo.disponible.toFixed(2)}</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-600" />
              Distribución Banco (Neto: ${totales.netoBanco.toFixed(2)})
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Ahorro ({totales.porcentajes.porcentajeAhorro}%)</span>
                <span className="font-semibold text-green-700">${totales.distribucionBanco.ahorro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Inversión ({totales.porcentajes.porcentajeInversion}%)</span>
                <span className="font-semibold text-blue-700">${totales.distribucionBanco.inversion.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Emergencia ({totales.porcentajes.porcentajeEmergencia}%)</span>
                <span className="font-semibold text-orange-700">${totales.distribucionBanco.emergencia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Disponible ({totales.porcentajes.porcentajeDisponible}%)</span>
                <span className="font-semibold text-purple-700">${totales.distribucionBanco.disponible.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de transacciones */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <History className="h-5 w-5" />
            Transacciones
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay transacciones que coincidan con los filtros
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${transaction.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.tipo === 'ingreso' ? '+' : '-'}${parseFloat(transaction.monto).toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        transaction.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.tipo}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {transaction.metodo}
                      </span>
                      {transaction.categoria && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {transaction.categoria}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(transaction.fecha).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      {transaction.descripcion && <span className="truncate max-w-[300px]">{transaction.descripcion}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transacción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editMonto}
                onChange={(e) => setEditMonto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={editMetodo} onValueChange={(v) => setEditMetodo(v as PaymentMethod)}>
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
              <Label>Descripción</Label>
              <Textarea
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            ¿Estás seguro de que deseas eliminar esta transacción de ${deletingTransaction ? parseFloat(deletingTransaction.monto).toFixed(2) : '0.00'}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
