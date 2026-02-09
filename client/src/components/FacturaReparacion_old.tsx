import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Mail } from 'lucide-react';

interface FacturaReparacionProps {
  reparacion: {
    id: number;
    cliente: string;
    telefono: string;
    dispositivo: string;
    problema: string;
    precio: number;
    fecha: Date;
    estado: string;
  };
  taxRate: number;
}

export function FacturaReparacion({ reparacion, taxRate }: FacturaReparacionProps) {
  const subtotal = reparacion.precio;
  const taxes = subtotal * (taxRate / 100);
  const total = subtotal + taxes;

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // TODO: Implementar envío por correo
    alert('Función de envío por correo en desarrollo');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      {/* Botones de acción (no se imprimen) */}
      <div className="flex gap-4 mb-6 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
        <Button onClick={handleEmail} variant="outline" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Enviar por Correo
        </Button>
      </div>

      {/* Contenido de la factura (se imprime) */}
      <div className="border-2 border-gray-300 p-8">
        {/* Membrete */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <img 
              src="/logo-1plusphonefix.png" 
              alt="1+PhoneFix" 
              className="h-16 mb-2"
            />
            <p className="text-sm text-gray-600">Phone Repair, Sales & Unlocking</p>
            <p className="text-sm text-gray-600">Austin, TX</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <p className="text-sm text-gray-600 mt-2">Invoice #{reparacion.id}</p>
            <p className="text-sm text-gray-600">
              {new Date(reparacion.fecha).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Customer Information</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm"><span className="font-semibold">Name:</span> {reparacion.cliente}</p>
            <p className="text-sm"><span className="font-semibold">Phone:</span> {reparacion.telefono}</p>
            <p className="text-sm"><span className="font-semibold">Device:</span> {reparacion.dispositivo}</p>
          </div>
        </div>

        {/* Detalles de la reparación */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Repair Details</h2>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 text-sm">{reparacion.problema}</td>
                <td className="text-right p-3 text-sm">${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-semibold">Subtotal:</span>
                <span className="text-sm">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-semibold">Tax ({taxRate}%):</span>
                <span className="text-sm">${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-100 px-3 mt-2">
                <span className="text-lg font-bold">TOTAL:</span>
                <span className="text-lg font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Garantía Bilingüe */}
        <div className="border-t-2 border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            WARRANTY / GARANTÍA
          </h2>
          
          {/* Garantía en Inglés */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">English:</h3>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                <strong>90-Day Limited Warranty:</strong> We guarantee our repairs for 90 days from the date of service. 
                This warranty covers defects in workmanship and parts used in the repair.
              </p>
              <p>
                <strong>What's Covered:</strong> Malfunctions directly related to the repair performed, defective replacement parts.
              </p>
              <p>
                <strong>What's NOT Covered:</strong> Physical damage (drops, liquid damage, cracks), normal wear and tear, 
                unauthorized repairs or modifications, damage caused by misuse or neglect.
              </p>
              <p>
                <strong>Warranty Claim:</strong> To make a warranty claim, bring your device and this invoice to our store. 
                We will inspect the device and, if the issue is covered, repair or replace the defective part at no charge.
              </p>
              <p className="font-semibold">
                This warranty is non-transferable and applies only to the original customer.
              </p>
            </div>
          </div>

          {/* Garantía en Español */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Español:</h3>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                <strong>Garantía Limitada de 90 Días:</strong> Garantizamos nuestras reparaciones por 90 días desde la fecha del servicio. 
                Esta garantía cubre defectos en la mano de obra y las partes utilizadas en la reparación.
              </p>
              <p>
                <strong>Qué Está Cubierto:</strong> Fallas directamente relacionadas con la reparación realizada, partes de reemplazo defectuosas.
              </p>
              <p>
                <strong>Qué NO Está Cubierto:</strong> Daños físicos (caídas, daño por líquidos, grietas), desgaste normal, 
                reparaciones o modificaciones no autorizadas, daños causados por mal uso o negligencia.
              </p>
              <p>
                <strong>Reclamación de Garantía:</strong> Para hacer una reclamación de garantía, traiga su dispositivo y esta factura a nuestra tienda. 
                Inspeccionaremos el dispositivo y, si el problema está cubierto, repararemos o reemplazaremos la parte defectuosa sin cargo.
              </p>
              <p className="font-semibold">
                Esta garantía no es transferible y aplica solo al cliente original.
              </p>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Thank you for choosing 1+PhoneFix! / ¡Gracias por elegir 1+PhoneFix!</p>
          <p className="mt-1">For questions or concerns, please contact us.</p>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-4xl {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          .border-2 {
            border: none;
          }
        }
      `}</style>
    </div>
  );
}
