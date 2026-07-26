import { useState, useEffect } from 'react';
import { Check, ShoppingCart, Flame } from 'lucide-react';

interface CartItem {
  id: string;
  tipo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

interface DisplayState {
  cart: CartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  storeName: string;
}

interface CompletedState {
  transaction: any;
  storeName: string;
}

const BC_CHANNEL = 'fixopolis-pos';

export default function POSDisplay() {
  const [state, setState] = useState<'idle' | 'cart' | 'complete'>('idle');
  const [displayData, setDisplayData] = useState<DisplayState | null>(null);
  const [completedData, setCompletedData] = useState<CompletedState | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to BroadcastChannel from cashier
  useEffect(() => {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
      bc.onmessage = (event) => {
        const { type, ...data } = event.data;
        if (type === 'CART_UPDATE') {
          if (data.cart && data.cart.length > 0) {
            setState('cart');
            setDisplayData(data as DisplayState);
          } else {
            setState('idle');
            setDisplayData(null);
          }
        } else if (type === 'PAYMENT_COMPLETE') {
          setState('complete');
          setCompletedData(data as CompletedState);
        } else if (type === 'READY') {
          setState('idle');
          setDisplayData(null);
          setCompletedData(null);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }
    return () => bc?.close();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // IDLE STATE
  if (state === 'idle') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #f97316 0%, transparent 50%), radial-gradient(circle at 75% 75%, #f97316 0%, transparent 50%)'
        }} />
        
        <div className="relative z-10 text-center px-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-white">Fixopolis</h1>
              <p className="text-orange-400 font-semibold text-lg -mt-1">Solutions</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-5xl font-bold text-white mb-2">{formatTime(currentTime)}</p>
            <p className="text-gray-400 text-lg capitalize">{formatDate(currentTime)}</p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-8 max-w-md mx-auto">
            <ShoppingCart size={48} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Esperando su orden...</p>
          </div>

          <p className="text-gray-700 text-xs mt-8">Reparaciones · Accesorios · Servicios</p>
        </div>
      </div>
    );
  }

  // PAYMENT COMPLETE STATE
  if (state === 'complete' && completedData) {
    const t = completedData.transaction;
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #22c55e 0%, transparent 60%)'
        }} />
        
        <div className="relative z-10 text-center px-8 max-w-lg w-full">
          {/* Success animation */}
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
            <Check size={48} className="text-green-400" />
          </div>

          <h1 className="text-4xl font-black text-white mb-2">¡Gracias!</h1>
          <p className="text-gray-400 text-lg mb-8">Su pago fue procesado exitosamente</p>

          {/* Receipt */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left mb-6">
            {/* Store header */}
            <div className="text-center mb-4 pb-4 border-b border-gray-800">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame size={16} className="text-orange-400" />
                <span className="font-bold text-orange-400">Fixopolis Solutions</span>
              </div>
              <p className="text-xs text-gray-500">Recibo #{t.codigo}</p>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {(t.items || []).map((item: CartItem, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-white">{item.nombre}</span>
                    {item.cantidad > 1 && (
                      <span className="text-gray-500 ml-2">x{item.cantidad}</span>
                    )}
                  </div>
                  <span className="text-gray-300 ml-4">${item.subtotal?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-800 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>${t.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Tax ({t.taxRate?.toFixed(1)}%)</span>
                <span>${t.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-white pt-2 border-t border-gray-700">
                <span>TOTAL</span>
                <span className="text-orange-400">${t.total?.toFixed(2)}</span>
              </div>
              {t.cambio > 0 && (
                <div className="flex justify-between text-sm text-green-400 pt-1">
                  <span>Cambio</span>
                  <span>${t.cambio?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="mt-4 pt-3 border-t border-gray-800 text-center">
              <span className="text-xs text-gray-500">
                Pagado con: <span className="text-gray-300 capitalize">{t.metodoPago}</span>
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-sm">¡Vuelva pronto! 🙏</p>
        </div>
      </div>
    );
  }

  // CART STATE
  if (state === 'cart' && displayData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Flame size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-lg">Fixopolis Solutions</h1>
              <p className="text-xs text-gray-400">Su orden</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatTime(currentTime)}</p>
            <p className="text-xs text-gray-500 capitalize">{formatDate(currentTime)}</p>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Items list */}
          <div className="flex-1 p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Detalle de Orden
            </h2>
            <div className="space-y-3">
              {displayData.cart.map((item, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.nombre}</p>
                    <p className="text-sm text-gray-400">${item.precio.toFixed(2)} × {item.cantidad}</p>
                  </div>
                  <span className="text-lg font-bold text-orange-400">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary panel */}
          <div className="w-72 bg-gray-900 border-l border-gray-800 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Resumen</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${displayData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax ({(displayData.taxRate * 100).toFixed(1)}%)</span>
                  <span className="text-white font-medium">${displayData.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">TOTAL</span>
                    <span className="text-3xl font-black text-orange-400">${displayData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <p className="text-orange-400 text-sm font-medium">Presentando su orden...</p>
                <p className="text-gray-500 text-xs mt-1">Por favor espere</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
