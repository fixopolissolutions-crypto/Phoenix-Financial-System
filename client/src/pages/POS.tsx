import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Shuffle, X, Check,
  Package, Wrench, Smartphone, Tag, ChevronRight,
  Printer, Mail, RefreshCw, ExternalLink
} from 'lucide-react';

interface CartItem {
  id: string;
  tipo: 'reparacion' | 'accesorio' | 'parte' | 'servicio';
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  imagen?: string;
}

interface PaymentState {
  metodo: 'efectivo' | 'tarjeta' | 'mixto';
  montoEfectivo: string;
  montoTarjeta: string;
  cambio: number;
}

// Server-based customer display sync
const sendDisplayUpdate = async (tienda: string, payload: object) => {
  try {
    await fetch('/api/pos-display/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tienda, ...payload }),
    });
  } catch (e) {
    console.warn('Display sync error:', e);
  }
};

export default function POS() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'todos' | 'accesorios' | 'partes' | 'servicios'>('todos');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [payment, setPayment] = useState<PaymentState>({
    metodo: 'efectivo',
    montoEfectivo: '',
    montoTarjeta: '',
    cambio: 0,
  });
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [taxRate, setTaxRate] = useState(0.085);
  const [barcodeNotif, setBarcodeNotif] = useState<{message: string; success: boolean} | null>(null);
  // Barcode scanner detection
  const barcodeBufferRef = useRef('');
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tienda = (user as any)?.tienda || 'admin';

  // Barcode scanner: detect rapid keystrokes (scanner inputs chars faster than human typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Enter') {
        // Process the barcode buffer
        const barcode = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        
        if (barcode.length >= 6) {
          // Find product by barcode in allProducts
          const product = allProductsRef.current.find(p => p.barcode === barcode);
          if (product) {
            addToCartRef.current(product);
            // Show feedback
            const event = new CustomEvent('barcode-scanned', { detail: { barcode, found: true, nombre: product.nombre } });
            window.dispatchEvent(event);
          } else {
            const event = new CustomEvent('barcode-scanned', { detail: { barcode, found: false } });
            window.dispatchEvent(event);
          }
        }
        return;
      }
      
      // Accumulate characters
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        // Reset buffer after 100ms of inactivity (scanner sends chars very fast)
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for barcode scan events to show notifications
  useEffect(() => {
    const handleBarcodeScan = (e: CustomEvent) => {
      const { found, nombre, barcode } = e.detail;
      if (found) {
        setBarcodeNotif({ message: `✓ ${nombre} agregado al carrito`, success: true });
      } else {
        setBarcodeNotif({ message: `Código no encontrado: ${barcode}`, success: false });
      }
      setTimeout(() => setBarcodeNotif(null), 3000);
    };
    window.addEventListener('barcode-scanned', handleBarcodeScan as EventListener);
    return () => window.removeEventListener('barcode-scanned', handleBarcodeScan as EventListener);
  }, []);

  // Load tax rate from config
  const configQuery = trpc.config.getAll.useQuery();
  useEffect(() => {
    if (configQuery.data?.taxRate) {
      setTaxRate(parseFloat(configQuery.data.taxRate) / 100);
    }
  }, [configQuery.data]);

  // Inventory queries
  const accessoriesQuery = trpc.inventoryAccessories.list.useQuery({ activo: 1 });
  const partsQuery = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const servicesQuery = trpc.posServices.list.useQuery();

  // Sync cart to server for customer display
  useEffect(() => {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    sendDisplayUpdate(tienda, {
      type: cart.length > 0 ? 'CART_UPDATE' : 'IDLE',
      cart,
      subtotal,
      taxRate,
      taxAmount,
      total,
      storeName: 'Fixopolis Solutions',
    });
  }, [cart, taxRate, tienda]);

  const createPosMutation = trpc.pos.create.useMutation();

  // Computed values
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Build product catalog
  const allProducts = [
    ...(accessoriesQuery.data || []).map((a: any) => ({
      id: `acc-${a.id}`,
      tipo: 'accesorio' as const,
      nombre: a.nombre,
      precio: parseFloat(a.precioVentaUnitario || a.precioVenta || a.precioCompra || '0'),
      stock: a.cantidadActual || a.cantidad || 0,
      categoria: 'accesorios',
      barcode: a.barcode || `FIX-ACC-${String(a.id).padStart(5, '0')}`,
      imagen: a.imagen || undefined,
    })),
    ...(partsQuery.data || []).map((p: any) => ({
      id: `part-${p.id}`,
      tipo: 'parte' as const,
      nombre: p.nombre,
      precio: parseFloat(p.precioUnitario || p.precioCompraUnitario || '0'),
      stock: p.cantidadActual || p.cantidad || 0,
      categoria: 'partes',
      barcode: p.barcode || `FIX-PRT-${String(p.id).padStart(5, '0')}`,
      imagen: p.imagen || undefined,
    })),
    // Services from database
    ...(servicesQuery.data || []).filter((s: any) => s.activo).map((s: any) => ({
      id: `svc-${s.id}`,
      tipo: 'servicio' as const,
      nombre: s.nombre,
      precio: parseFloat(String(s.precio)),
      stock: 99,
      categoria: 'servicios',
      imagen: s.imagen || undefined,
    })),
  ];

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || p.categoria === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Refs for barcode scanner access
  const allProductsRef = useRef(allProducts);
  allProductsRef.current = allProducts;

  const addToCart = (product: typeof allProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
          : i
        );
      }
      return [...prev, {
        id: product.id,
        tipo: product.tipo,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1,
        subtotal: product.precio,
      }];
    });
  };

  // Ref for barcode scanner access
  const addToCartRef = useRef(addToCart);
  addToCartRef.current = addToCart;

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.id === id
        ? { ...i, cantidad: Math.max(0, i.cantidad + delta), subtotal: Math.max(0, i.cantidad + delta) * i.precio }
        : i
      )
      .filter(i => i.cantidad > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setClienteNombre('');
    setClienteEmail('');
    setClienteTelefono('');
    setNotas('');
  };

  // Payment logic
  useEffect(() => {
    if (payment.metodo === 'efectivo') {
      const monto = parseFloat(payment.montoEfectivo) || 0;
      setPayment(p => ({ ...p, cambio: Math.max(0, monto - total) }));
    } else if (payment.metodo === 'mixto') {
      const efectivo = parseFloat(payment.montoEfectivo) || 0;
      const tarjeta = parseFloat(payment.montoTarjeta) || 0;
      setPayment(p => ({ ...p, cambio: Math.max(0, efectivo + tarjeta - total) }));
    }
  }, [payment.montoEfectivo, payment.montoTarjeta, payment.metodo, total]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    try {
      const result = await createPosMutation.mutateAsync({
        items: cart,
        subtotal,
        taxRate: taxRate * 100,
        taxAmount,
        total,
        metodoPago: payment.metodo,
        montoEfectivo: payment.metodo !== 'tarjeta' ? parseFloat(payment.montoEfectivo) || undefined : undefined,
        montoTarjeta: payment.metodo !== 'efectivo' ? parseFloat(payment.montoTarjeta) || undefined : undefined,
        cambio: payment.cambio,
        clienteNombre: clienteNombre || undefined,
        clienteEmail: clienteEmail || undefined,
        clienteTelefono: clienteTelefono || undefined,
        notas: notas || undefined,
        tienda,
        cajero: (user as any)?.username || 'Admin',
      });
      setLastTransaction(result);
      // Push payment complete to customer display via server
      sendDisplayUpdate(tienda, {
        type: 'PAYMENT_COMPLETE',
        transaction: result,
        storeName: 'Fixopolis Solutions',
      });
      setShowPayment(false);
      setShowSuccess(true);
      clearCart();
    } catch (err) {
      console.error('Error creating POS transaction:', err);
      alert('Error al procesar la venta. Intenta de nuevo.');
    }
  };

  const openCustomerDisplay = () => {
    window.open('/pos/display', '_blank', 'width=800,height=600,toolbar=no,menubar=no');
  };

  const categoryIcons = {
    todos: <Package size={14} />,
    accesorios: <Tag size={14} />,
    partes: <Wrench size={14} />,
    servicios: <Smartphone size={14} />,
  };

  const tipoColors = {
    accesorio: 'bg-blue-500/20 text-blue-300',
    parte: 'bg-purple-500/20 text-purple-300',
    servicio: 'bg-orange-500/20 text-orange-300',
    reparacion: 'bg-green-500/20 text-green-300',
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Barcode scan notification */}
      {barcodeNotif && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 transition-all ${
          barcodeNotif.success 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {barcodeNotif.success ? <Check size={16} /> : <X size={16} />}
          {barcodeNotif.message}
        </div>
      )}

      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Punto de Venta</h1>
              <p className="text-xs text-gray-400">Fixopolis Solutions</p>
            </div>
          </div>
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto o servicio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={openCustomerDisplay}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors"
          >
            <ExternalLink size={14} />
            Pantalla Cliente
          </button>
        </div>

        {/* Category tabs */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex gap-2">
          {(['todos', 'accesorios', 'partes', 'servicios'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {categoryIcons[cat]}
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-500 self-center">{filteredProducts.length} productos</span>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-orange-500/50 rounded-xl p-3 text-left transition-all group"
              >
                {/* Product image */}
                {(product as any).imagen ? (
                  <div className="w-full h-20 mb-2 rounded-lg overflow-hidden bg-white">
                    <img src={(product as any).imagen} alt={product.nombre} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mb-2 ${tipoColors[product.tipo]}`}>
                    {product.tipo}
                  </div>
                )}
                <p className="text-sm font-medium text-white leading-tight mb-1 line-clamp-2">{product.nombre}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-orange-400 font-bold text-sm">${product.precio.toFixed(2)}</span>
                  <div className="w-6 h-6 bg-orange-500/20 group-hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors">
                    <Plus size={12} className="text-orange-400 group-hover:text-white" />
                  </div>
                </div>
                {product.stock < 5 && product.stock < 99 && (
                  <p className="text-xs text-yellow-500 mt-1">Stock: {product.stock}</p>
                )}
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-orange-400" />
            <span className="font-semibold text-sm">Carrito</span>
            {cart.length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cart.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Customer Info */}
        <div className="px-4 py-3 border-b border-gray-800 space-y-2">
          <input
            type="text"
            placeholder="Nombre del cliente (opcional)"
            value={clienteNombre}
            onChange={e => setClienteNombre(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Teléfono"
              value={clienteTelefono}
              onChange={e => setClienteTelefono(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={clienteEmail}
              onChange={e => setClienteEmail(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Agrega productos al carrito</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  {item.imagen && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-tight truncate">{item.nombre}</p>
                    <p className="text-xs text-orange-400 mt-0.5">${item.precio.toFixed(2)} c/u</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-white">${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-gray-800 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white border-t border-gray-700 pt-2">
            <span>TOTAL</span>
            <span className="text-orange-400">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Cobrar ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Procesar Pago</h2>
                <button onClick={() => setShowPayment(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Total */}
              <div className="bg-gray-800 rounded-xl p-4 mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Total a cobrar</p>
                <p className="text-3xl font-bold text-orange-400">${total.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Incluye ${taxAmount.toFixed(2)} en taxes</p>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { value: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} /> },
                  { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={16} /> },
                  { value: 'mixto', label: 'Mixto', icon: <Shuffle size={16} /> },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPayment(p => ({ ...p, metodo: m.value as any }))}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${
                      payment.metodo === m.value
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {m.icon}
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Amount inputs */}
              {(payment.metodo === 'efectivo' || payment.metodo === 'mixto') && (
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">Monto en Efectivo</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={payment.montoEfectivo}
                    onChange={e => setPayment(p => ({ ...p, montoEfectivo: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
              {(payment.metodo === 'tarjeta' || payment.metodo === 'mixto') && (
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">Monto en Tarjeta</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={payment.montoTarjeta}
                    onChange={e => setPayment(p => ({ ...p, montoTarjeta: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* Change */}
              {payment.metodo !== 'tarjeta' && payment.cambio > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <span className="text-green-400 text-sm font-medium">Cambio a devolver</span>
                  <span className="text-green-400 text-lg font-bold">${payment.cambio.toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={handleCompleteSale}
                disabled={createPosMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {createPosMutation.isPending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {createPosMutation.isPending ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && lastTransaction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-500/30 rounded-2xl w-full max-w-sm text-center p-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">¡Venta Completada!</h2>
            <p className="text-gray-400 text-sm mb-4">Código: <span className="text-orange-400 font-mono font-bold">{lastTransaction.codigo}</span></p>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>${lastTransaction.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span>${lastTransaction.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-700 pt-2">
                <span>Total</span>
                <span className="text-orange-400">${lastTransaction.total?.toFixed(2)}</span>
              </div>
              {lastTransaction.cambio > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Cambio</span>
                  <span>${lastTransaction.cambio?.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={14} />
                Imprimir
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  sendDisplayUpdate(tienda, { type: 'IDLE', storeName: 'Fixopolis Solutions' });
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
