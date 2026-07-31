import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, Trash2, CheckCircle, Download, RotateCcw, AlertCircle } from "lucide-react";

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

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Línea guía
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 50);
    ctx.lineTo(canvas.width - 30, canvas.height - 50);
    ctx.stroke();
    ctx.setLineDash([]);
    // Texto guía
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✍  Firme aquí con el dedo o el mouse", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
  }, []);

  useEffect(() => {
    if (modoEdicion) {
      setTimeout(() => initCanvas(), 60);
    }
  }, [modoEdicion, initCanvas]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
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
    // Limpiar texto guía al primer trazo
    if (!tieneFirma) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(30, canvas.height - 50);
        ctx.lineTo(canvas.width - 30, canvas.height - 50);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    setDibujando(true);
    lastPos.current = getPos(e, canvas);
  }, [disabled, tieneFirma]);

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
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
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
    setTieneFirma(false);
    initCanvas();
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
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <PenLine className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Firma Digital del Cliente</p>
            {nombreCliente && (
              <p className="text-xs text-gray-500">{nombreCliente}</p>
            )}
          </div>
        </div>
        {firmaMostrada && !modoEdicion && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Guardada en recibo
          </span>
        )}
      </div>

      {modoEdicion ? (
        <div className="space-y-3">
          {/* Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              La firma se incluirá en el <strong>recibo imprimible</strong> de esta reparación. Pida al cliente que firme abajo y luego presione <strong>"Guardar Firma"</strong>.
            </p>
          </div>

          {/* Canvas */}
          <div className="relative border-2 border-blue-300 rounded-xl overflow-hidden bg-white shadow-sm"
            style={{ minHeight: "180px" }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="w-full touch-none cursor-crosshair"
              style={{ display: "block", background: "white" }}
            />
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={limpiarFirma}
              className="flex items-center gap-1.5 text-gray-600 border-gray-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={guardarFirma}
              disabled={!tieneFirma}
              className={`flex items-center gap-2 flex-1 justify-center font-semibold transition-all text-sm py-2 ${
                tieneFirma
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {tieneFirma ? "Guardar Firma en Recibo ✓" : "Firme en el recuadro primero"}
            </Button>
          </div>
        </div>
      ) : firmaMostrada ? (
        <div className="space-y-2">
          {/* Firma guardada */}
          <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-white p-3 shadow-sm">
            <p className="text-xs text-gray-400 mb-1 text-center">Vista previa de la firma en el recibo:</p>
            <img
              src={firmaMostrada}
              alt="Firma del cliente"
              className="w-full max-h-32 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Firma guardada. Aparecerá en el recibo al descargarlo como PDF.</span>
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={editarFirma}
                className="flex items-center gap-1.5 text-gray-600 text-xs"
              >
                <PenLine className="w-3.5 h-3.5" />
                Volver a firmar
              </Button>
              <a
                href={firmaMostrada}
                download={`firma-${(nombreCliente || 'cliente').replace(/\s+/g, '-')}.png`}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar imagen
              </a>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-blue-300 bg-blue-50/40 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
          }`}
          onClick={() => !disabled && setModoEdicion(true)}
        >
          <PenLine className="w-10 h-10 text-blue-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-600">Toca para capturar la firma</p>
          <p className="text-xs text-gray-400 mt-1">La firma se incluirá en el recibo imprimible</p>
        </div>
      )}
    </div>
  );
}
