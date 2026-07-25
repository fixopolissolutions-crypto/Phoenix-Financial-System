import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Fetch inventory data for low-stock badge
  const { data: parts = [] } = trpc.inventoryParts.list.useQuery({ activo: 1 });
  const { data: accessories = [] } = trpc.inventoryAccessories.list.useQuery({ activo: 1 });

  const lowStockParts = useMemo(() => parts.filter(p => Number(p.cantidadActual) <= Number(p.stockMinimo)).length, [parts]);
  const lowStockAccessories = useMemo(() => accessories.filter(a => Number(a.cantidadActual) <= Number(a.stockMinimo)).length, [accessories]);

  if (!user) {
    setLocation('/');
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Reportes', href: '/reportes', icon: FileText },
    { name: 'Taxes', href: '/taxes', icon: Receipt },
    { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
    { name: 'Gastos', href: '/gastos', icon: TrendingDown },
    { name: 'Historial', href: '/historial', icon: History },
    { name: 'Inversión de Capital', href: '/inversion-capital', icon: Package },
    { name: 'Reparaciones', href: '/reparaciones', icon: Wrench },
    { name: 'Inventario Partes', href: '/inventario/partes', icon: Package, lowStock: lowStockParts },
    { name: 'Inventario Accesorios', href: '/inventario/accesorios', icon: Package, lowStock: lowStockAccessories },
    { name: 'Servidor', href: '/servidor', icon: Server },
    { name: 'Proveedores', href: '/proveedores', icon: Users },
    { name: 'Configuración Tienda', href: '/configuracion-tienda', icon: Store },
    { name: 'Nómina', href: '/nomina', icon: Wallet },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{user.name}</h2>
              <p className="text-xs text-muted-foreground">Fixopolis Solutions</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const badge = (item as any).lowStock;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{item.name}</span>
                {badge > 0 && (
                  <span className="flex items-center gap-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
          onClick={() => {
            logout();
            setLocation('/');
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
