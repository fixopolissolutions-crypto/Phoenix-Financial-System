import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reportes from "./pages/Reportes";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import Proveedores from "./pages/Proveedores";
import Nomina from "./pages/Nomina";
import Configuracion from "./pages/Configuracion";
import Taxes from "./pages/Taxes";
import Historial from "./pages/Historial";
import InversionCapital from "./pages/InversionCapital";
import InventarioTelefonos from "./pages/InventarioTelefonos";
import InventarioAccesorios from "./pages/InventarioAccesorios";
import InventarioPartes from "./pages/InventarioPartes";
import Reparaciones from "./pages/Reparaciones";
import ConfiguracionTienda from './pages/ConfiguracionTienda';
import Servidor from './pages/Servidor';
import POS from './pages/POS';
import POSDisplay from './pages/POSDisplay';

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/reportes">
        {() => <ProtectedRoute component={Reportes} />}
      </Route>
      <Route path="/ingresos">
        {() => <ProtectedRoute component={Ingresos} />}
      </Route>
      <Route path="/gastos">
        {() => <ProtectedRoute component={Gastos} />}
      </Route>
      <Route path="/proveedores">
        {() => <ProtectedRoute component={Proveedores} />}
      </Route>
      <Route path="/nomina">
        {() => <ProtectedRoute component={Nomina} />}
      </Route>
      <Route path="/configuracion">
        {() => <ProtectedRoute component={Configuracion} />}
      </Route>
      <Route path="/taxes">
        {() => <ProtectedRoute component={Taxes} />}
      </Route>
      <Route path="/historial">
        {() => <ProtectedRoute component={Historial} />}
      </Route>
      <Route path="/inversion-capital">
        {() => <ProtectedRoute component={InversionCapital} />}
      </Route>
      <Route path="/inventario/telefonos">
        {() => <ProtectedRoute component={InventarioTelefonos} />}
      </Route>
      <Route path="/inventario/accesorios">
        {() => <ProtectedRoute component={InventarioAccesorios} />}
      </Route>
      <Route path="/inventario/partes">
        {() => <ProtectedRoute component={InventarioPartes} />}
      </Route>
      <Route path="/reparaciones">
        {() => <ProtectedRoute component={Reparaciones} />}
      </Route>
      <Route path="/configuracion-tienda">
        {() => <ProtectedRoute component={ConfiguracionTienda} />}
      </Route>
      <Route path="/servidor">
        {() => <ProtectedRoute component={Servidor} />}
      </Route>
      <Route path="/pos">
        {() => <ProtectedRoute component={POS} />}
      </Route>
      <Route path="/pos/display" component={POSDisplay} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
// Force redeploy - Store Config Feature - Sun Feb 09 2026
// Force redeploy - POS migration - Sun Jul 26 08:07:13 UTC 2026
