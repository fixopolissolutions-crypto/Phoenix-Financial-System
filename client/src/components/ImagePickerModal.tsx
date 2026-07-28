import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';

// Preset gallery images stored in /public/gallery/
const GALLERY_PRESETS = [
  { file: '/gallery/funda-telefono.png',      label: 'Funda de Teléfono' },
  { file: '/gallery/protector-pantalla.png',  label: 'Protector de Pantalla' },
  { file: '/gallery/cargador-usbc.png',       label: 'Cable USB-C' },
  { file: '/gallery/cargador-lightning.png',  label: 'Cable Lightning' },
  { file: '/gallery/adaptador-pared.png',     label: 'Adaptador de Pared' },
  { file: '/gallery/cargador-inalambrico.png',label: 'Cargador Inalámbrico' },
  { file: '/gallery/power-bank.png',          label: 'Power Bank' },
  { file: '/gallery/audifonos-bluetooth.png', label: 'Audífonos Bluetooth' },
  { file: '/gallery/audifonos-cable.png',     label: 'Audífonos con Cable' },
  { file: '/gallery/altavoz-bocina.png',      label: 'Bocina Bluetooth' },
  { file: '/gallery/soporte-auto.png',        label: 'Soporte para Auto' },
  { file: '/gallery/bateria-iphone.png',      label: 'Batería de Repuesto' },
  { file: '/gallery/pantalla-lcd.png',        label: 'Pantalla LCD' },
  { file: '/gallery/camara-trasera.png',      label: 'Cámara Trasera' },
  { file: '/gallery/conector-flex.png',       label: 'Conector Flex' },
  { file: '/gallery/servicio-pantalla.png',   label: 'Servicio: Pantalla' },
  { file: '/gallery/servicio-bateria.png',    label: 'Servicio: Batería' },
  { file: '/gallery/servicio-camara.png',     label: 'Servicio: Cámara' },
  { file: '/gallery/servicio-software.png',   label: 'Servicio: Software' },
  { file: '/gallery/producto-generico.png',   label: 'Producto Genérico' },
];

interface ImagePickerModalProps {
  currentImage?: string | null;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function ImagePickerModal({ currentImage, onSelect, onClose }: ImagePickerModalProps) {
  const [tab, setTab] = useState<'gallery' | 'upload'>('gallery');
  const [selected, setSelected] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Preview
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const base64Reader = new FileReader();
      base64Reader.onload = async () => {
        const dataUrl = base64Reader.result as string;
        const base64 = dataUrl.split(',')[1];
        const res = await fetch('/api/product-image/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al subir imagen');
        }
        const { url } = await res.json();
        setSelected(url);
        setUploading(false);
      };
      base64Reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir imagen');
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (selected) onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-orange-400" />
            <h2 className="text-white font-bold text-lg">Imagen del Producto</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['gallery', 'upload'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'gallery' ? '📷 Galería predefinida' : '⬆️ Subir foto propia'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'gallery' && (
            <div className="grid grid-cols-4 gap-3">
              {GALLERY_PRESETS.map(preset => (
                <button
                  key={preset.file}
                  onClick={() => setSelected(preset.file)}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                    selected === preset.file
                      ? 'border-orange-500 ring-2 ring-orange-500/30'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="aspect-square bg-white">
                    <img
                      src={preset.file}
                      alt={preset.label}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="bg-gray-800 px-2 py-1">
                    <p className="text-gray-300 text-xs text-center truncate">{preset.label}</p>
                  </div>
                  {selected === preset.file && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              {/* Upload area */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-600 hover:border-orange-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <Upload size={32} className="text-gray-500 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">Haz clic para seleccionar una foto</p>
                <p className="text-gray-500 text-sm mt-1">JPG, PNG, WEBP — máx. 10MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview */}
              {(uploadPreview || (selected && selected.startsWith('http'))) && (
                <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-4">
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uploadPreview || selected || ''}
                      alt="Vista previa"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    {uploading ? (
                      <div className="flex items-center gap-2 text-orange-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Subiendo imagen...</span>
                      </div>
                    ) : selected && selected.startsWith('http') ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <Check size={16} />
                        <span className="text-sm font-medium">Imagen subida correctamente</span>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Procesando...</p>
                    )}
                    {uploadError && (
                      <p className="text-red-400 text-sm mt-1">{uploadError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex gap-3">
          {selected && (
            <button
              onClick={() => { onSelect(''); onClose(); }}
              className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              Quitar imagen
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || uploading}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            {selected ? 'Usar esta imagen' : 'Selecciona una imagen'}
          </button>
        </div>
      </div>
    </div>
  );
}
