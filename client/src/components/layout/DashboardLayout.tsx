import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Settings,
  LogOut,
  FileText,
  Building2,
  Receipt,
  History,
  Package,
  Wrench,
  Store,
  Server,
  AlertTriangle,
  Search,
  Bell,
  ChevronRight,
  Flame,
  ShoppingCart,
  Scissors,
  Sun,
  Moon,
  Truck,
  CalendarDays,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useMemo, useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navGroups = [
  {
    label: 'OPERACIONES',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: true },
      { name: 'Reparaciones', href: '/reparaciones', icon: Wrench, adminOnly: true },
      { name: 'Presupuestos', href: '/presupuestos', icon: FileText, adminOnly: true },
      { name: 'Clientes', href: '/clientes', icon: Users, adminOnly: true },
      { name: 'Órdenes de Partes', href: '/ordenes-partes', icon: Truck, adminOnly: true },
      { name: 'Agenda', href: '/agenda', icon: CalendarDays, adminOnly: true },
      { name: 'Servidor', href: '/servidor', icon: Server, adminOnly: true },
      { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
      { name: 'Historial POS', href: '/pos/historial', icon: Receipt },
    ],
  },
  {
    label: 'FINANZAS',
    adminOnly: true,
    items: [
      { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
      { name: 'Gastos', href: '/gastos', icon: TrendingDown },
      { name: 'Taxes', href: '/taxes', icon: Receipt },
      { name: 'Historial', href: '/historial', icon: History },
      { name: 'Inversión de Capital', href: '/inversion-capital', icon: TrendingUp },
      { name: 'Reportes', href: '/reportes', icon: FileText },
    ],
  },
  {
    label: 'INVENTARIO',
    adminOnly: true,
    items: [
      { name: 'Partes', href: '/inventario/partes', icon: Package, lowStockKey: 'parts' },
      { name: 'Accesorios', href: '/inventario/accesorios', icon: Package, lowStockKey: 'accessories' },
      { name: 'Servicios', href: '/servicios', icon: Scissors },
      { name: 'Proveedores', href: '/proveedores', icon: Users },
    ],
  },
  {
    label: 'ADMINISTRACIÓN',
    adminOnly: true,
    items: [
      { name: 'Nómina', href: '/nomina', icon: Wallet },
      { name: 'Config. Tienda', href: '/configuracion-tienda', icon: Store },
      { name: 'Configuración', href: '/configuracion', icon: Settings },
    ],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Fetch inventory data for low-stock badge
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const { data: accessories = [] } = trpc.inventoryAccessories.list.useQuery({ activo: 1 });

  const lowStockCounts = useMemo(() => ({
    parts: parts.filter(p => Number(p.cantidadActual) <= Number(p.stockMinimo)).length,
    accessories: accessories.filter(a => Number(a.cantidadActual) <= Number(a.stockMinimo)).length,
  }), [parts, accessories]);

  const totalLowStock = lowStockCounts.parts + lowStockCounts.accessories;

  if (!user) {
    setLocation('/');
    return null;
  }

  const formattedDate = currentTime.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Sidebar nav content (shared between desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-tight">Fixopolis</h2>
            <p className="text-orange-400 text-xs font-medium">Solutions</p>
          </div>
        </div>
        {/* Close button only on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.filter(g => isAdmin || !(g as any).adminOnly).map((group) => {
          const visibleItems = group.items.filter(item => isAdmin || !(item as any).adminOnly);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-500 px-2 mb-2 tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location === item.href;
                  const lowStock = (item as any).lowStockKey ? lowStockCounts[(item as any).lowStockKey as keyof typeof lowStockCounts] : 0;
                  return (
                    <button
                      key={item.href}
                      onClick={() => { setLocation(item.href); setMobileMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      )}
                      style={isActive ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left text-xs">{item.name}</span>
                      {lowStock > 0 && (
                        <span className="flex items-center gap-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {lowStock}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{isAdmin ? 'Administrador' : 'Cajero'}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); setLocation('/'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col overflow-y-auto z-30"
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}
      >
        <SidebarContent />
      </aside>

      {/* ===== MOBILE DRAWER OVERLAY ===== */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===== MOBILE DRAWER ===== */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-full w-72 flex flex-col overflow-y-auto z-50 transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}
      >
        <SidebarContent />
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-3 lg:px-6 py-3 flex items-center gap-2 lg:gap-4">

          {/* Hamburger button (mobile only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Logo text on mobile */}
          <span className="lg:hidden font-bold text-orange-500 text-sm flex-shrink-0">Fixopolis</span>

          {/* Date (desktop only) */}
          <div className="hidden lg:flex items-center gap-2 text-gray-500 text-sm min-w-0">
            <span className="capitalize truncate">{formattedDate}</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs lg:max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm focus:bg-white"
              />
            </div>
          </div>

          {/* Right side: clock + dark mode + notifications */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <span className="text-sm font-mono font-semibold text-gray-700 hidden md:block">
              {formattedTime}
            </span>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
            <div className="relative">
              <button className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
              {totalLowStock > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalLowStock}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 lg:p-6">
          {children}
        </main>
      </div>

      {/* Floating POS quick-access button (hidden when already on /pos) */}
      {location !== '/pos' && (
        <button
          onClick={() => setLocation('/pos')}
          className="fixed bottom-6 right-4 lg:right-6 z-50 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-4 py-3 rounded-2xl shadow-lg shadow-orange-500/30 transition-all"
          title="Ir al Punto de Venta"
        >
          <ShoppingCart size={20} />
          <span className="text-sm">POS</span>
        </button>
      )}
    </div>
  );
}
