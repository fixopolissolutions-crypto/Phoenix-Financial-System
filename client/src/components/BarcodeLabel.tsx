import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Printer } from 'lucide-react';

interface BarcodeLabelProps {
  barcode: string;
  nombre: string;
  precio: number;
  tipo: 'parte' | 'accesorio';
  onClose: () => void;
}

export function BarcodeLabel({ barcode, nombre, precio, tipo, onClose }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && barcode) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 8,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
      }
    }
  }, [barcode]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    const svgContent = svgRef.current?.outerHTML || '';
    const tipoLabel = tipo === 'parte' ? 'Parte' : 'Accesorio';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${nombre}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background: white;
            }
            .label {
              border: 2px solid #000;
              padding: 8px 12px;
              width: 280px;
              text-align: center;
              background: white;
            }
            .store-name {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .product-name {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.2;
            }
            .product-type {
              font-size: 10px;
              color: #666;
              margin-bottom: 6px;
            }
            .barcode-container svg {
              max-width: 100%;
            }
            .price {
              font-size: 18px;
              font-weight: bold;
              margin-top: 4px;
              border-top: 1px solid #ccc;
              padding-top: 4px;
            }
            @media print {
              body { margin: 0; }
              .label { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="store-name">Fixopolis Solutions</div>
            <div class="product-name">${nombre}</div>
            <div class="product-type">${tipoLabel}</div>
            <div class="barcode-container">${svgContent}</div>
            <div class="price">$${precio.toFixed(2)}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-96 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Etiqueta de Código de Barras</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg p-4 mb-4 text-center">
          <div className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-2 mb-2">
            Fixopolis Solutions
          </div>
          <div className="text-sm font-bold text-gray-900 mb-1 leading-tight">{nombre}</div>
          <div className="text-xs text-gray-500 mb-2 capitalize">{tipo}</div>
          <div className="flex justify-center overflow-hidden">
            <svg ref={svgRef} className="max-w-full" />
          </div>
          <div className="text-lg font-bold text-gray-900 mt-2 border-t border-gray-300 pt-2">
            ${precio.toFixed(2)}
          </div>
        </div>

        {/* Barcode info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 mb-1">Código:</div>
          <div className="text-sm font-mono text-orange-400 font-bold">{barcode}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function to generate a barcode string
export function generateBarcodeString(tipo: 'parte' | 'accesorio', id: number): string {
  const prefix = tipo === 'parte' ? 'FIX-PRT' : 'FIX-ACC';
  const paddedId = String(id).padStart(5, '0');
  return `${prefix}-${paddedId}`;
}
