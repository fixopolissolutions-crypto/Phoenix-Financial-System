import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, QrCode, X } from 'lucide-react';

const BASE_URL = 'https://fixopolisfinanzas.com';

interface EtiquetaQRProps {
  open: boolean;
  onClose: () => void;
  repair: {
    codigo: string;
    cliente: string;
    telefono?: string;
    dispositivo?: string;
    problema?: string;
    tecnico?: string;
    fechaIngreso?: string;
    estado?: string;
  };
  storeName?: string;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completada: 'Lista',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

export function EtiquetaQR({ open, onClose, repair, storeName = 'Fixopolis Solutions' }: EtiquetaQRProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const trackUrl = `${BASE_URL}/track?code=${repair.codigo}`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const svgEl = content.querySelector('svg');
    const svgString = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
    const svgDataUrl = svgString
      ? 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
      : '';

    printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Etiqueta ${repair.codigo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; }
    @page { size: 62mm 90mm; margin: 0; }
    .label {
      width: 62mm; height: 90mm;
      padding: 4mm;
      display: flex; flex-direction: column;
      border: 1px solid #ccc;
      page-break-after: always;
    }
    .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 2mm; margin-bottom: 2mm; }
    .store { font-size: 9pt; font-weight: 800; letter-spacing: 0.5px; color: #111; }
    .badge { display: inline-block; background: #f97316; color: #fff; padding: 1mm 3mm; border-radius: 2mm; font-size: 11pt; font-weight: 700; margin-top: 1mm; }
    .qr-section { display: flex; justify-content: center; margin: 2mm 0; }
    .qr-section img { width: 28mm; height: 28mm; }
    .info { flex: 1; }
    .info-row { display: flex; gap: 1mm; margin-bottom: 1.5mm; font-size: 7.5pt; }
    .info-label { color: #666; min-width: 14mm; flex-shrink: 0; }
    .info-value { font-weight: 600; color: #111; word-break: break-word; }
    .estado { display: inline-block; background: #fef3c7; color: #92400e; padding: 0.5mm 2mm; border-radius: 2mm; font-size: 7pt; font-weight: 700; margin-bottom: 1.5mm; }
    .footer { border-top: 1px solid #eee; padding-top: 1.5mm; text-align: center; font-size: 6pt; color: #888; }
    .scan-text { font-size: 6.5pt; color: #555; text-align: center; margin-top: 1mm; }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <div class="store">${storeName.toUpperCase()}</div>
      <div class="badge">${repair.codigo}</div>
    </div>
    <div class="qr-section">
      ${svgDataUrl ? `<img src="${svgDataUrl}" />` : `<div style="width:28mm;height:28mm;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#999">QR</div>`}
    </div>
    <div class="scan-text">Escanea para rastrear tu reparación</div>
    <div class="info" style="margin-top:2mm">
      <div class="info-row"><span class="info-label">Cliente:</span><span class="info-value">${repair.cliente}</span></div>
      ${repair.telefono ? `<div class="info-row"><span class="info-label">Tel:</span><span class="info-value">${repair.telefono}</span></div>` : ''}
      ${repair.dispositivo ? `<div class="info-row"><span class="info-label">Equipo:</span><span class="info-value">${repair.dispositivo}</span></div>` : ''}
      ${repair.problema ? `<div class="info-row"><span class="info-label">Falla:</span><span class="info-value">${repair.problema.substring(0, 40)}${repair.problema.length > 40 ? '...' : ''}</span></div>` : ''}
      ${repair.tecnico ? `<div class="info-row"><span class="info-label">Técnico:</span><span class="info-value">${repair.tecnico}</span></div>` : ''}
      ${repair.fechaIngreso ? `<div class="info-row"><span class="info-label">Ingreso:</span><span class="info-value">${new Date(repair.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
      <div class="estado">${ESTADO_LABEL[repair.estado || 'pendiente'] || repair.estado}</div>
    </div>
    <div class="footer">${trackUrl}</div>
  </div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-500" />
            Etiqueta QR — {repair.codigo}
          </DialogTitle>
        </DialogHeader>

        {/* Vista previa de la etiqueta */}
        <div ref={printRef} className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-white mx-auto" style={{ width: '220px' }}>
          {/* Header */}
          <div className="text-center border-b border-gray-300 pb-2 mb-2">
            <p className="text-xs font-black tracking-wide text-gray-800">{storeName.toUpperCase()}</p>
            <span className="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-0.5 rounded mt-1">
              {repair.codigo}
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center my-2">
            <QRCodeSVG
              value={trackUrl}
              size={100}
              level="M"
              includeMargin={false}
              fgColor="#111111"
            />
          </div>
          <p className="text-center text-gray-400 text-[9px] mb-2">Escanea para rastrear tu reparación</p>

          {/* Info */}
          <div className="space-y-1 text-[10px]">
            <div className="flex gap-1"><span className="text-gray-400 w-12 flex-shrink-0">Cliente:</span><span className="font-semibold text-gray-800 truncate">{repair.cliente}</span></div>
            {repair.dispositivo && <div className="flex gap-1"><span className="text-gray-400 w-12 flex-shrink-0">Equipo:</span><span className="font-semibold text-gray-800 truncate">{repair.dispositivo}</span></div>}
            {repair.tecnico && <div className="flex gap-1"><span className="text-gray-400 w-12 flex-shrink-0">Técnico:</span><span className="font-semibold text-gray-800 truncate">{repair.tecnico}</span></div>}
            {repair.fechaIngreso && <div className="flex gap-1"><span className="text-gray-400 w-12 flex-shrink-0">Ingreso:</span><span className="font-semibold text-gray-800">{new Date(repair.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span></div>}
            <span className="inline-block bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-0.5 rounded mt-1">
              {ESTADO_LABEL[repair.estado || 'pendiente'] || repair.estado}
            </span>
          </div>

          {/* Footer URL */}
          <div className="border-t border-gray-100 mt-2 pt-1 text-center text-[8px] text-gray-400 truncate">
            {trackUrl}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Tamaño de impresión: 62mm × 90mm (etiqueta estándar)
        </p>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Imprimir Etiqueta
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
