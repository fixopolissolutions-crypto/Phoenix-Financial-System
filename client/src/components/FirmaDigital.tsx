import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, Trash2, CheckCircle, Download } from "lucide-react";

interface FirmaDigitalProps {
  onFirmaGuardada: (firmaBase64: string) => void;
  firmaExistente?: string | null;
  nombreCliente?: string;
  disabled?: boolean;
}

export default function FirmaDigital({
  onFirmaGuardada,
  firmaExistente,
  nombreCliente,
  disabled = false,
}: FirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);
  const [firmaMostrada, setFirmaMostrada] = useState<string | null>(firmaExistente || null);
  const [modoEdicion, setModoEdicion] = useState(!firmaExistente);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (firmaExistente) {
      setFirmaMostrada(firmaExistente);
      setModoEdicion(false);
      setTieneFirma(true);
    }
  }, [firmaExistente]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const iniciarDibujo = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDibujando(true);
    lastPos.current = getPos(e, canvas);
  }, [disabled]);

  const dibujar = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dibujando || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setTieneFirma(true);
  }, [dibujando, disabled]);

  const terminarDibujo = useCallback(() => {
    setDibujando(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !modoEdicion) return;

    // Inicializar canvas con fondo blanco
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Línea guía
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(20, canvas.height - 40);
      ctx.lineTo(canvas.width - 20, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    canvas.addEventListener("mousedown", iniciarDibujo);
    canvas.addEventListener("mousemove", dibujar);
    canvas.addEventListener("mouseup", terminarDibujo);
    canvas.addEventListener("mouseleave", terminarDibujo);
    canvas.addEventListener("touchstart", iniciarDibujo, { passive: false });
    canvas.addEventListener("touchmove", dibujar, { passive: false });
    canvas.addEventListener("touchend", terminarDibujo);

    return () => {
      canvas.removeEventListener("mousedown", iniciarDibujo);
      canvas.removeEventListener("mousemove", dibujar);
      canvas.removeEventListener("mouseup", terminarDibujo);
      canvas.removeEventListener("mouseleave", terminarDibujo);
      canvas.removeEventListener("touchstart", iniciarDibujo);
      canvas.removeEventListener("touchmove", dibujar);
      canvas.removeEventListener("touchend", terminarDibujo);
    };
  }, [modoEdicion, iniciarDibujo, dibujar, terminarDibujo]);

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(20, canvas.height - 40);
      ctx.lineTo(canvas.width - 20, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    setTieneFirma(false);
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas || !tieneFirma) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFirmaMostrada(dataUrl);
    setModoEdicion(false);
    onFirmaGuardada(dataUrl);
  };

  const editarFirma = () => {
    setModoEdicion(true);
    setFirmaMostrada(null);
    setTieneFirma(false);
    // El useEffect se encargará de limpiar el canvas
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Firma del Cliente</span>
          {tieneFirma && !modoEdicion && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Firmado
            </span>
          )}
        </div>
        {nombreCliente && (
          <span className="text-xs text-gray-500">{nombreCliente}</span>
        )}
      </div>

      {modoEdicion ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              className="w-full touch-none cursor-crosshair"
              style={{ display: "block" }}
            />
            {!tieneFirma && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm select-none">Firme aquí</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={limpiarFirma}
              className="flex items-center gap-1.5 text-gray-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={guardarFirma}
              disabled={!tieneFirma}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirmar Firma
            </Button>
          </div>
        </div>
      ) : firmaMostrada ? (
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-3">
            <img
              src={firmaMostrada}
              alt="Firma del cliente"
              className="w-full max-h-32 object-contain"
            />
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={editarFirma}
                className="flex items-center gap-1.5 text-gray-600"
              >
                <PenLine className="w-3.5 h-3.5" />
                Volver a firmar
              </Button>
              <a
                href={firmaMostrada}
                download="firma-cliente.png"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </a>
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          onClick={() => !disabled && setModoEdicion(true)}
        >
          <PenLine className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Toca para capturar la firma del cliente</p>
        </div>
      )}
    </div>
  );
}
