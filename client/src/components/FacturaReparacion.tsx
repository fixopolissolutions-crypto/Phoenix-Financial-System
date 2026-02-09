import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface FacturaReparacionProps {
  repair: any;
}

export function FacturaReparacion({ repair }: FacturaReparacionProps) {
  const handlePrint = () => {
    window.print();
  };

  // Calcular fecha de vencimiento de garantía (60 días)
  const fechaGarantia = new Date(repair.fechaIngreso);
  fechaGarantia.setDate(fechaGarantia.getDate() + 60);

  const isPagado = repair.pagado === 1;

  return (
    <div className="relative">
      {/* Botón de imprimir (no se imprime) */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Recibo
        </Button>
      </div>

      {/* Contenido del recibo - Formato A4 */}
      <div className="relative bg-white print:p-0" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
        {/* Sello de agua PAGADO (solo si está pagado) */}
        {isPagado && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            style={{ 
              opacity: 0.15,
              transform: 'rotate(-45deg)',
            }}
          >
            <div className="text-center">
              <div className="text-9xl font-bold text-green-600" style={{ fontSize: '180px' }}>
                PAGADO
              </div>
              <img 
                src="/logo-1plusphonefix.png" 
                alt="Logo" 
                className="mx-auto mt-8"
                style={{ width: '200px', filter: 'grayscale(100%)' }}
              />
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="relative z-0 p-12">
          {/* Encabezado */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-300">
            <div>
              <img 
                src="/logo-1plusphonefix.png" 
                alt="1+PhoneFix" 
                className="h-20 mb-3"
              />
              <p className="text-base font-semibold text-gray-800">1+PhoneFix</p>
              <p className="text-sm text-gray-600">Reparación de Teléfonos</p>
              <p className="text-sm text-gray-600">Austin, TX</p>
              <p className="text-sm text-gray-600">Tel: (512) XXX-XXXX</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">RECIBO</h1>
              <p className="text-lg font-semibold text-gray-700">#{repair.codigo}</p>
              <p className="text-sm text-gray-600 mt-2">
                Fecha: {new Date(repair.fechaIngreso).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {isPagado && (
                <div className="mt-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded font-semibold">
                  ✓ PAGADO
                </div>
              )}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
              Información del Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente:</p>
                <p className="text-base font-semibold">{repair.cliente || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono:</p>
                <p className="text-base font-semibold">{repair.telefono || 'No especificado'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Dispositivo:</p>
                <p className="text-base font-semibold">{repair.dispositivo}</p>
              </div>
            </div>
          </div>

          {/* Descripción del Servicio */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
              Descripción del Servicio
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Problema Reportado:</p>
              <p className="text-base">{repair.problema}</p>
            </div>
            {repair.diagnostico && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Diagnóstico:</p>
                <p className="text-base">{repair.diagnostico}</p>
              </div>
            )}
          </div>

          {/* Detalles de Costos */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
              Detalles de Costos
            </h2>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 border">Concepto</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700 border">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 text-sm border">Mano de Obra</td>
                  <td className="text-right p-3 text-sm border font-semibold">
                    ${Number(repair.precioManoObra).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-sm border">Costo de Partes</td>
                  <td className="text-right p-3 text-sm border font-semibold">
                    ${Number(repair.costoPartes || 0).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 text-base font-bold border">TOTAL</td>
                  <td className="text-right p-3 text-lg font-bold border text-green-600">
                    ${Number(repair.precioTotal).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Garantía */}
          <div className="mb-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>🛡️</span>
              Garantía de Servicio
            </h2>
            <div className="space-y-2">
              <p className="text-base font-semibold text-blue-900">
                Este servicio cuenta con una garantía de 60 días
              </p>
              <p className="text-sm text-blue-800">
                Válida hasta: <span className="font-bold">
                  {fechaGarantia.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
              <div className="mt-4 text-xs text-blue-700 space-y-1">
                <p>• La garantía cubre defectos en la reparación realizada</p>
                <p>• No cubre daños por mal uso o accidentes posteriores</p>
                <p>• Debe presentar este recibo para hacer válida la garantía</p>
                <p>• La garantía es válida únicamente en 1+PhoneFix</p>
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          {repair.notas && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Notas:</h2>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded border border-gray-200">
                {repair.notas}
              </p>
            </div>
          )}

          {/* Pie de página */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Gracias por confiar en 1+PhoneFix
              </p>
              <p className="text-xs text-gray-500">
                Este documento es un comprobante de servicio
              </p>
              <p className="text-xs text-gray-500">
                Para consultas o soporte, contáctenos al (512) XXX-XXXX
              </p>
            </div>
          </div>

          {/* Firma del Cliente (espacio) */}
          <div className="mt-12 pt-8">
            <div className="flex justify-between items-end">
              <div className="w-64">
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="text-sm text-gray-600 text-center">Firma del Cliente</p>
                </div>
              </div>
              <div className="w-64">
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="text-sm text-gray-600 text-center">Firma del Técnico</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
