#!/bin/bash

# Este script crea las 5 páginas restantes del sistema
# Proveedores, Nomina, Configuracion, DashboardGeneral, Reportes

BASE="/home/ubuntu/phonefix-financial-system/client/src/pages"

echo "Creando páginas restantes..."

# Crear cada archivo con placeholder básico
for page in Proveedores Nomina Configuracion DashboardGeneral Reportes; do
  cat > "$BASE/${page}.tsx" << EOF
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ${page}() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">${page}</h1>
          <p className="text-muted-foreground">Página en desarrollo</p>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground">
            Esta funcionalidad está siendo implementada...
          </p>
          <Button className="mt-4">Próximamente</Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
EOF
  echo "✅ ${page}.tsx created"
done

echo "✅ Todas las páginas creadas!"
