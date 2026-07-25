import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

interface CajaChicaAlertProps {
  umbral?: number; // Porcentaje del umbral (default 20%)
}

export default function CajaChicaAlert({ umbral = 20 }: CajaChicaAlertProps) {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<{ tienda: string; disponible: number; cajaChica: number }[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    checkCajaChica();
    // Verificar cada minuto
    const interval = setInterval(checkCajaChica, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const checkCajaChica = () => {
    if (!user) return;

    const config = storage.getConfig();
    const nuevasAlertas: { tienda: string; disponible: number; cajaChica: number }[] = [];

    // Verificar tienda principal (admin)
    if (user.role === 'admin') {
      const adminData = storage.getDailyData('admin');
      const ingresosEfectivo = adminData.ingresos
        .filter(i => i.metodo === 'efectivo')
        .reduce((sum, i) => sum + i.monto, 0);
      const gastosEfectivo = adminData.gastos
        .filter(g => g.metodo === 'efectivo')
        .reduce((sum, g) => sum + g.monto, 0);
      
      const taxRate = config.taxRate / 100;
      const netoEfectivo = ingresosEfectivo * (1 - taxRate);
      const disponibleEfectivo = netoEfectivo * (config.porcentajeDisponible / 100) - gastosEfectivo + config.cajaChicaAdmin;

      const umbraLimite = config.cajaChicaAdmin * (umbral / 100);
      
      if (disponibleEfectivo < umbraLimite && disponibleEfectivo >= 0) {
        nuevasAlertas.push({
          tienda: 'Fixopolis Solutions',
          disponible: disponibleEfectivo,
          cajaChica: config.cajaChicaAdmin
        });
      }

      // También verificar sucursal si es admin
      const sucursalData = storage.getDailyData('sucursal');
      const ingresosSucursal = sucursalData.ingresos
        .filter(i => i.metodo === 'efectivo')
        .reduce((sum, i) => sum + i.monto, 0);
      const gastosSucursal = sucursalData.gastos
        .filter(g => g.metodo === 'efectivo')
        .reduce((sum, g) => sum + g.monto, 0);
      
      const netoSucursal = ingresosSucursal * (1 - taxRate);
      const disponibleSucursal = netoSucursal * (config.porcentajeDisponible / 100) - gastosSucursal + config.cajaChicaSucursal;

      const umbralSucursal = config.cajaChicaSucursal * (umbral / 100);
      
      if (disponibleSucursal < umbralSucursal && disponibleSucursal >= 0) {
        nuevasAlertas.push({
          tienda: 'Fixopolis Solutions Sucursal',
          disponible: disponibleSucursal,
          cajaChica: config.cajaChicaSucursal
        });
      }
    } else {
      // Sucursal solo ve su propia alerta
      const sucursalData = storage.getDailyData('sucursal');
      const ingresosEfectivo = sucursalData.ingresos
        .filter(i => i.metodo === 'efectivo')
        .reduce((sum, i) => sum + i.monto, 0);
      const gastosEfectivo = sucursalData.gastos
        .filter(g => g.metodo === 'efectivo')
        .reduce((sum, g) => sum + g.monto, 0);
      
      const taxRate = config.taxRate / 100;
      const netoEfectivo = ingresosEfectivo * (1 - taxRate);
      const disponibleEfectivo = netoEfectivo * (config.porcentajeDisponible / 100) - gastosEfectivo + config.cajaChicaSucursal;

      const umbraLimite = config.cajaChicaSucursal * (umbral / 100);
      
      if (disponibleEfectivo < umbraLimite && disponibleEfectivo >= 0) {
        nuevasAlertas.push({
          tienda: 'Fixopolis Solutions Sucursal',
          disponible: disponibleEfectivo,
          cajaChica: config.cajaChicaSucursal
        });
      }
    }

    setAlertas(nuevasAlertas.filter(a => !dismissed.includes(a.tienda)));
  };

  const dismissAlert = (tienda: string) => {
    setDismissed([...dismissed, tienda]);
    setAlertas(alertas.filter(a => a.tienda !== tienda));
  };

  if (alertas.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {alertas.map((alerta) => (
        <Alert key={alerta.tienda} variant="destructive" className="bg-amber-50 border-amber-300 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="flex items-center justify-between">
            <span>⚠️ Caja Chica Baja - {alerta.tienda}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alerta.tienda)}
              className="h-6 w-6 p-0 hover:bg-amber-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            El efectivo disponible (${alerta.disponible.toFixed(2)}) está por debajo del {umbral}% de la caja chica configurada (${alerta.cajaChica.toFixed(2)}).
            <br />
            <span className="font-medium">Considera agregar más efectivo o reducir gastos.</span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
