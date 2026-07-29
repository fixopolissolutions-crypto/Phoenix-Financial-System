import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  Search, Filter, X, ChevronDown, ChevronUp,
  User, Mail, Phone, Calendar, CreditCard,
  Banknote, Shuffle, Package, FileText, Clock,
  ShieldCheck, Printer, Receipt
} from 'lucide-react';

interface Transaction {
  id: number;
  codigo: string;
  items: Array<{ nombre: string; cantidad: number; precio: number; subtotal: number; tipo: string }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'mixto';
  montoEfectivo?: number;
  montoTarjeta?: number;
  cambio: number;
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  notas?: string;
  cajero?: string;
  createdAt: string | Date;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('es-PR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString('es-PR', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function MetodoBadge({ metodo }: { metodo: string }) {
  const map: Record<string, { label: string; cls: string; icon: JSX.Element }> = {
    efectivo: { label: 'Efectivo', cls: 'bg-green-500/20 text-green-300 border-green-500/30', icon: <Banknote size={12} /> },
    tarjeta:  { label: 'Tarjeta',  cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   icon: <CreditCard size={12} /> },
    mixto:    { label: 'Mixto',    cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: <Shuffle size={12} /> },
  };
  const m = map[metodo] ?? { label: metodo, cls: 'bg-gray-700 text-gray-300 border-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${m.cls}`}>
      {m.icon}{m.label}
    </span>
  );
}

function DetailModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo ${tx.codigo}</title>
      <style>
        body { font-family: monospace; font-size: 13px; padding: 20px; max-width: 320px; }
        h2 { text-align: center; font-size: 16px; margin-bottom: 4px; }
        p { text-align: center; margin: 2px 0; font-size: 11px; color: #555; }
        hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .bold { font-weight: bold; }
        .total { font-size: 16px; font-weight: bold; }
      </style></head><body>
      <h2>Fixopolis Solutions</h2>
      <p>Recibo: ${tx.codigo}</p>
      <p>${formatDate(tx.createdAt)}</p>
      ${tx.clienteNombre ? `<p>Cliente: ${tx.clienteNombre}</p>` : ''}
      ${tx.cajero ? `<p>Cajero: ${tx.cajero}</p>` : ''}
      <hr/>
      ${tx.items.map(i => `<div class="row"><span>${i.nombre} x${i.cantidad}</span><span>$${i.subtotal.toFixed(2)}</span></div>`).join('')}
      <hr/>
      <div class="row"><span>Subtotal</span><span>$${tx.subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Tax (${tx.taxRate.toFixed(1)}%)</span><span>$${tx.taxAmount.toFixed(2)}</span></div>
      <div class="row total"><span>TOTAL</span><span>$${tx.total.toFixed(2)}</span></div>
      ${tx.cambio > 0 ? `<div class="row"><span>Cambio</span><span>$${tx.cambio.toFixed(2)}</span></div>` : ''}
      <hr/>
      <p>Método: ${tx.metodoPago}</p>
      ${tx.notas ? `<p>Notas: ${tx.notas}</p>` : ''}
      <hr/><p>¡Gracias por su preferencia!</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={18} className="text-orange-400" />
              <h2 className="text-white font-bold text-lg">{tx.codigo}</h2>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              <Clock size={12} />{formatDate(tx.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Client info */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-orange-400" /> Datos del Cliente / Garantía
            </h3>
            {tx.clienteNombre ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <User size={14} className="text-orange-400" />
                </div>
                <span className="text-white font-medium">{tx.clienteNombre}</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Sin nombre registrado</p>
            )}
            {tx.clienteEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail size={13} className="text-gray-500" />{tx.clienteEmail}
              </div>
            )}
            {tx.clienteTelefono && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone size={13} className="text-gray-500" />{tx.clienteTelefono}
              </div>
            )}
            {tx.cajero && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User size={13} className="text-gray-500" />Cajero: {tx.cajero}
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package size={14} className="text-orange-400" /> Artículos / Servicios
            </h3>
            <div className="space-y-2">
              {tx.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{item.nombre}</p>
                    <p className="text-gray-500 text-xs">${item.precio.toFixed(2)} × {item.cantidad}</p>
                  </div>
                  <span className="text-orange-400 font-bold text-sm">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span><span>${tx.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax ({tx.taxRate.toFixed(1)}%)</span><span>${tx.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white border-t border-gray-700 pt-2">
              <span>TOTAL</span><span className="text-orange-400">${tx.total.toFixed(2)}</span>
            </div>
            {tx.cambio > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Cambio entregado</span><span>${tx.cambio.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-1">
              <MetodoBadge metodo={tx.metodoPago} />
              {tx.montoEfectivo && tx.metodoPago === 'mixto' && (
                <span className="text-xs text-gray-500 ml-2">Efectivo: ${tx.montoEfectivo.toFixed(2)} · Tarjeta: ${(tx.montoTarjeta ?? 0).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {tx.notas && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h3 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                <FileText size={13} /> Notas
              </h3>
              <p className="text-gray-300 text-sm">{tx.notas}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={handlePrint}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Printer size={16} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POSHistorial() {
  const { user } = useAuth();
  const tienda = (user as any)?.tienda || 'admin';

  const [search, setSearch] = useState('');
  const [metodoPago, setMetodoPago] = useState('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [customerProfile, setCustomerProfile] = useState<string | null>(null); // nombre del cliente para ver perfil

  const query = trpc.pos.search.useQuery({
    search: search || undefined,
    metodoPago: metodoPago !== 'todos' ? metodoPago : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    tienda,
    limit: 200,
  }, { refetchInterval: 30000 });

  const transactions: Transaction[] = (query.data?.transactions ?? []) as Transaction[];
  const totalCount = query.data?.total ?? 0;

  // Stats
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const withClient = transactions.filter(t => t.clienteNombre).length;
  const avgTicket = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  const clearFilters = () => {
    setSearch('');
    setMetodoPago('todos');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = search || metodoPago !== 'todos' || dateFrom || dateTo;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-white p-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                <Receipt size={18} className="text-white" />
              </div>
              Historial de Ventas POS
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Consulta clientes, recibos y garantías de todas las transacciones
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Ventas encontradas', value: totalCount.toString(), sub: 'en el filtro actual', color: 'text-white' },
            { label: 'Ingresos totales', value: `$${totalRevenue.toFixed(2)}`, sub: 'suma del filtro', color: 'text-orange-400' },
            { label: 'Ticket promedio', value: `$${avgTicket.toFixed(2)}`, sub: 'por venta', color: 'text-blue-400' },
            { label: 'Con datos de cliente', value: withClient.toString(), sub: `de ${transactions.length} ventas`, color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, teléfono o código de recibo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}
            >
              <Filter size={14} />
              Filtros
              {hasFilters && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                <X size={14} /> Limpiar
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-800">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="todos">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Transactions list */}
        {query.isLoading ? (
          <div className="text-center py-20 text-gray-500">Cargando historial...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <Receipt size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron transacciones</p>
            {hasFilters && <p className="text-gray-600 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                {/* Row summary */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                >
                  {/* Date */}
                  <div className="w-20 text-center flex-shrink-0">
                    <p className="text-white text-sm font-bold">{new Date(tx.createdAt).toLocaleDateString('es-PR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* Code */}
                  <div className="w-24 flex-shrink-0">
                    <span className="font-mono text-orange-400 text-sm font-bold">{tx.codigo}</span>
                  </div>

                  {/* Client */}
                  <div className="flex-1 min-w-0">
                    {tx.clienteNombre ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCustomerProfile(tx.clienteNombre!); }}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left w-full"
                        title="Ver perfil del cliente"
                      >
                        <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate underline decoration-dotted underline-offset-2">{tx.clienteNombre}</p>
                          {tx.clienteEmail && <p className="text-gray-500 text-xs truncate">{tx.clienteEmail}</p>}
                          {tx.clienteTelefono && !tx.clienteEmail && <p className="text-gray-500 text-xs">{tx.clienteTelefono}</p>}
                        </div>
                      </button>
                    ) : (
                      <span className="text-gray-600 text-sm italic">Sin nombre</span>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="hidden md:block w-48 flex-shrink-0">
                    <p className="text-gray-400 text-xs truncate">
                      {tx.items.slice(0, 2).map(i => i.nombre).join(', ')}
                      {tx.items.length > 2 && ` +${tx.items.length - 2} más`}
                    </p>
                    <p className="text-gray-600 text-xs">{tx.items.length} artículo{tx.items.length !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Method */}
                  <div className="flex-shrink-0">
                    <MetodoBadge metodo={tx.metodoPago} />
                  </div>

                  {/* Total */}
                  <div className="w-24 text-right flex-shrink-0">
                    <p className="text-white font-bold">${tx.total.toFixed(2)}</p>
                    {tx.cambio > 0 && <p className="text-green-400 text-xs">Cambio: ${tx.cambio.toFixed(2)}</p>}
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 text-gray-600">
                    {expandedId === tx.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded quick view */}
                {expandedId === tx.id && (
                  <div className="border-t border-gray-800 px-4 py-4 bg-gray-800/30">
                    <div className="flex gap-6">
                      {/* Items */}
                      <div className="flex-1">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Artículos</p>
                        <div className="space-y-1">
                          {tx.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-300">{item.nombre} <span className="text-gray-600">×{item.cantidad}</span></span>
                              <span className="text-gray-400">${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Client details */}
                      <div className="w-56 flex-shrink-0">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Cliente / Garantía</p>
                        {tx.clienteNombre && <p className="text-white text-sm">{tx.clienteNombre}</p>}
                        {tx.clienteEmail && <p className="text-gray-400 text-xs">{tx.clienteEmail}</p>}
                        {tx.clienteTelefono && <p className="text-gray-400 text-xs">{tx.clienteTelefono}</p>}
                        {!tx.clienteNombre && !tx.clienteEmail && !tx.clienteTelefono && (
                          <p className="text-gray-600 text-xs italic">Sin datos de cliente</p>
                        )}
                        {tx.notas && <p className="text-yellow-400 text-xs mt-2 italic">"{tx.notas}"</p>}
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                          <Receipt size={13} /> Ver recibo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTx && <DetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Customer Profile Modal */}
      {customerProfile && (() => {
        const clientTxs = transactions.filter(t => t.clienteNombre === customerProfile);
        const clientTotal = clientTxs.reduce((s, t) => s + t.total, 0);
        const firstTx = clientTxs[clientTxs.length - 1];
        const lastTx = clientTxs[0];
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-800 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500/40">
                    <User size={24} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{customerProfile}</h2>
                    {firstTx?.clienteEmail && <p className="text-gray-400 text-sm">{firstTx.clienteEmail}</p>}
                    {firstTx?.clienteTelefono && <p className="text-gray-400 text-sm">{firstTx.clienteTelefono}</p>}
                  </div>
                </div>
                <button onClick={() => setCustomerProfile(null)} className="text-gray-500 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-800">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">{clientTxs.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Visitas</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-400">${clientTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total gastado</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">${(clientTotal / clientTxs.length).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ticket prom.</p>
                </div>
              </div>

              {/* Dates */}
              {firstTx && lastTx && (
                <div className="px-4 py-2 border-b border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Primera visita: <span className="text-gray-300">{formatDateShort(firstTx.createdAt)}</span></span>
                  <span>Última visita: <span className="text-gray-300">{formatDateShort(lastTx.createdAt)}</span></span>
                </div>
              )}

              {/* Transaction list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Historial de compras</p>
                {clientTxs.map(t => (
                  <div
                    key={t.id}
                    onClick={() => { setCustomerProfile(null); setSelectedTx(t); }}
                    className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-3 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-orange-400 text-xs">{t.codigo}</span>
                        <MetodoBadge metodo={t.metodoPago} />
                      </div>
                      <p className="text-gray-400 text-xs truncate">{t.items.map(i => i.nombre).join(', ')}</p>
                      <p className="text-gray-600 text-xs">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className="text-white font-bold flex-shrink-0">${t.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
