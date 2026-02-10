import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface FacturaReparacionProps {
  repair: any;
}

export function FacturaReparacion({ repair }: FacturaReparacionProps) {
  const handlePrint = () => {
    window.print();
  };

  // Agregar estilos de impresión
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Calcular fecha de vencimiento de garantía (60 días)
  const fechaGarantia = new Date(repair.fechaIngreso);
  fechaGarantia.setDate(fechaGarantia.getDate() + 60);

  const isPagado = repair.pagado === 1;

  // Calcular subtotal y taxes
  const subtotal = Number(repair.precioTotal);
  const taxRate = 0.0825; // 8.25% tax rate
  const taxAmount = subtotal * taxRate;
  const totalConTax = subtotal + taxAmount;

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
              Resumen de Costos
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
                  <td className="p-3 text-sm border">Subtotal (Servicio de Reparación)</td>
                  <td className="text-right p-3 text-sm border font-semibold">
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-sm border">Tax (8.25%)</td>
                  <td className="text-right p-3 text-sm border font-semibold">
                    ${taxAmount.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 text-base font-bold border">TOTAL A PAGAR</td>
                  <td className="text-right p-3 text-lg font-bold border text-green-600">
                    ${totalConTax.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Garantía / Warranty */}
          <div className="mb-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>🛡️</span>
              WARRANTY / GARANTÍA
            </h2>
            
            {/* English */}
            <div className="mb-4 pb-4 border-b border-blue-300">
              <p className="text-base font-semibold text-blue-900 mb-2">
                English:
              </p>
              <p className="text-sm text-blue-800 mb-2">
                <strong>60-Day Limited Warranty:</strong> We guarantee our repairs for 60 days from the date of service. This warranty covers defects in workmanship and parts used in the repair.
              </p>
              <p className="text-xs text-blue-700 mb-1">
                <strong>What's Covered:</strong> Malfunctions directly related to the repair performed, defective replacement parts.
              </p>
              <p className="text-xs text-blue-700 mb-1">
                <strong>What's NOT Covered:</strong> Physical damage (drops, liquid damage, cracks), normal wear and tear, unauthorized repairs or modifications, damage caused by misuse or neglect.
              </p>
              <p className="text-xs text-blue-700">
                <strong>Warranty Claim:</strong> To make a warranty claim, bring your device and this invoice to our store. We will inspect the device and, if the issue is covered, repair or replace the defective part at no charge.
              </p>
              <p className="text-xs text-blue-700 italic mt-2">
                This warranty is non-transferable and applies only to the original customer.
              </p>
            </div>
            
            {/* Español */}
            <div>
              <p className="text-base font-semibold text-blue-900 mb-2">
                Español:
              </p>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Garantía Limitada de 60 Días:</strong> Garantizamos nuestras reparaciones por 60 días desde la fecha del servicio. Esta garantía cubre defectos en la mano de obra y las partes utilizadas en la reparación.
              </p>
              <p className="text-xs text-blue-700 mb-1">
                <strong>Qué Está Cubierto:</strong> Fallas directamente relacionadas con la reparación realizada, partes de reemplazo defectuosas.
              </p>
              <p className="text-xs text-blue-700 mb-1">
                <strong>Qué NO Está Cubierto:</strong> Daños físicos (caídas, daño por líquido, grietas), desgaste normal, reparaciones o modificaciones no autorizadas, daños causados por mal uso o negligencia.
              </p>
              <p className="text-xs text-blue-700">
                <strong>Reclamación de Garantía:</strong> Para hacer una reclamación de garantía, traiga su dispositivo y esta factura a nuestra tienda. Inspeccionaremos el dispositivo y, si el problema está cubierto, repararemos o reemplazaremos la parte defectuosa sin cargo.
              </p>
              <p className="text-xs text-blue-700 italic mt-2">
                Esta garantía no es transferible y se aplica solo al cliente original.
              </p>
              <p className="text-sm text-blue-800 font-bold mt-3">
                Válida hasta: {fechaGarantia.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
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
