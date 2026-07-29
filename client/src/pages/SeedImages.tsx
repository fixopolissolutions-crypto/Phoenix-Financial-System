import { useState } from "react";
import { trpc } from "@/lib/trpc";

// Complete image mapping for all 89 inventory parts
// Same model = same image regardless of quality (LCD/OLED/INCELL)
const IMAGE_MAPPING: Record<string, string> = {
  "PART-IP11-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/YnjEfztfVdOYTMgb.jpg",
  "PART-IP11P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/YnjEfztfVdOYTMgb.jpg",
  "PART-IP11PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/YnjEfztfVdOYTMgb.jpg",
  "PART-IP12-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/VCXYzVzrtMOjnxQm.jpg",
  "PART-IP12MINI-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/VCXYzVzrtMOjnxQm.jpg",
  "PART-IP12PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/VCXYzVzrtMOjnxQm.jpg",
  "PART-IP13-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/MDOJfARDumGvOBUM.jpg",
  "PART-IP13-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/AMgKbzcTROTPeaQh.jpg",
  "PART-IP13MINI-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/MDOJfARDumGvOBUM.jpg",
  "PART-IP13P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/CjwuKwPNCuhTageb.jpg",
  "PART-IP13P-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/CjwuKwPNCuhTageb.jpg",
  "PART-IP13PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/TYUmjjjdFTifgwDs.jpg",
  "PART-IP13PM-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/TYUmjjjdFTifgwDs.jpg",
  "PART-IP14-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/RTxEVEUfeExPmzaN.jpg",
  "PART-IP14-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/YRNwbOnHzFfYWWEV.jpg",
  "PART-IP14P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/fDfdukAIsLCCvhsR.jpg",
  "PART-IP14P-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/mINBniBPBIrjkJOR.jpg",
  "PART-IP14PLUS-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/SUtPBYKBKNhKdFBT.jpg",
  "PART-IP14PLUS-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/SUtPBYKBKNhKdFBT.jpg",
  "PART-IP14PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/nPOIbtWVwZiWlQTV.jpg",
  "PART-IP14PM-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/nPOIbtWVwZiWlQTV.jpg",
  "PART-IP15-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ZtjQdtkxgIWyxdQk.jpg",
  "PART-IP15-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ZtjQdtkxgIWyxdQk.jpg",
  "PART-IP15P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ZtjQdtkxgIWyxdQk.jpg",
  "PART-IP15P-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ZtjQdtkxgIWyxdQk.jpg",
  "PART-IP15PLUS-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/BhRdGQouVuoVhsMJ.jpg",
  "PART-IP15PLUS-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/BhRdGQouVuoVhsMJ.jpg",
  "PART-IP15PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/oaXEnfJheUKNvYTP.jpg",
  "PART-IP15PM-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/oaXEnfJheUKNvYTP.jpg",
  "PART-IP16-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/yFjgmLgRoHrkrpHZ.jpg",
  "PART-IP16-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/rpNtTigrxgjHcIGw.jpg",
  "PART-IP16E-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/rpNtTigrxgjHcIGw.jpg",
  "PART-IP16P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/OBULyZveMNdgbKLN.jpg",
  "PART-IP16P-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/BOYRISlAkhEgabQJ.jpg",
  "PART-IP16PLUS-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ztRPBoJzZyzyhUtz.jpg",
  "PART-IP16PLUS-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/BBaRVWUGwlxxbqRd.jpg",
  "PART-IP16PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/AbmyrgmFUwIwzxnd.jpg",
  "PART-IP16PM-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kIqmYdsorWYnmqCy.jpg",
  "PART-IP17-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ChpvehljMWJajyNR.jpg",
  "PART-IP17-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ChpvehljMWJajyNR.jpg",
  "PART-IP17P-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/XMDoDYOIbBdyXLca.jpg",
  "PART-IP17P-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/XMDoDYOIbBdyXLca.jpg",
  "PART-IP17PM-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ChpvehljMWJajyNR.jpg",
  "PART-IP17PM-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/ChpvehljMWJajyNR.jpg",
  "PART-IP8P-LCD-B": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/OCgTAnVzqrbpKGBp.jpg",
  "PART-IP8P-LCD-W": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/OCgTAnVzqrbpKGBp.jpg",
  "PART-IP8SE-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/OCgTAnVzqrbpKGBp.jpg",
  "PART-IPX-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/lVvfwBajHeIDIrzT.jpg",
  "PART-IPXR-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/lVvfwBajHeIDIrzT.jpg",
  "PART-IPXS-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/lVvfwBajHeIDIrzT.jpg",
  "PART-IPXSMAX-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/lVvfwBajHeIDIrzT.jpg",
  "PART-SMA02S-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA03-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA03S-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA03SU-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA04-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA04S-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA12-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA13-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA135G-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kXvmOJWJlzomYgri.jpg",
  "PART-SMA13NF-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA144G-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA145G-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kXvmOJWJlzomYgri.jpg",
  "PART-SMA145GU-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kXvmOJWJlzomYgri.jpg",
  "PART-SMA15-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA15-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA16-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA16-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA22-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kXvmOJWJlzomYgri.jpg",
  "PART-SMA23-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/kXvmOJWJlzomYgri.jpg",
  "PART-SMA30A50-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA32-LCD": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/crCwghpWGuAAHCwd.jpg",
  "PART-SMA33-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA34-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA35-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA36-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA52-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA53-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA54-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA54-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA55-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA56-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA70-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMA72-INCELL": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMS21U-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMS22U-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMS24U-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMS25-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
  "PART-SMS25U-OLED": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663852905221/IydYAaanzmIKQMbq.jpg",
};

export default function SeedImages() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const updateImagen = trpc.inventoryParts.updateImagen.useMutation();
  const getParts = trpc.inventoryParts.list.useQuery(undefined, { enabled: false });

  const handleSeed = async () => {
    setStatus("running");
    setLog([]);
    setProgress(0);

    try {
      const result = await getParts.refetch();
      const parts = (result.data || []) as any[];
      setLog(prev => [...prev, `📦 ${parts.length} partes encontradas en la base de datos`]);

      let updated = 0;
      let skipped = 0;
      const entries = Object.entries(IMAGE_MAPPING);

      for (let i = 0; i < entries.length; i++) {
        const [code, imageUrl] = entries[i];
        const part = parts.find((p: any) => p.codigo === code);
        if (!part) {
          skipped++;
        } else {
          try {
            await updateImagen.mutateAsync({ id: part.id, imagen: imageUrl });
            setLog(prev => [...prev, `✅ ${code}`]);
            updated++;
          } catch (e: any) {
            setLog(prev => [...prev, `❌ ${code} — ${e.message}`]);
          }
        }
        setProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      setLog(prev => [...prev, ``, `🎉 Completado. Actualizados: ${updated} | No encontrados: ${skipped}`]);
      setStatus("done");
    } catch (e: any) {
      setLog(prev => [...prev, `❌ Error fatal: ${e.message}`]);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🖼️ Asignar Imágenes RPX — Completo</h1>
        <p className="text-gray-400 mb-6">
          Asigna las imágenes del catálogo RPX a los{" "}
          <strong>{Object.keys(IMAGE_MAPPING).length} productos</strong> del inventario.
          Los modelos con dos calidades (LCD/OLED) comparten la misma imagen del proveedor.
        </p>

        {status === "idle" && (
          <button
            onClick={handleSeed}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Asignar Imágenes a Todos los Productos
          </button>
        )}

        {status === "running" && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span className="text-gray-300">Procesando... {progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-4">
            <p className="text-green-400 font-bold text-lg">✅ Proceso completado</p>
            <a
              href="/inventario/partes"
              className="inline-block mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Ver Inventario de Partes →
            </a>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-4 max-h-96 overflow-y-auto font-mono text-sm space-y-0.5">
            {log.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("✅") ? "text-green-400" :
                  line.startsWith("❌") ? "text-red-400" :
                  line.startsWith("🎉") ? "text-yellow-300 font-bold mt-2" :
                  line.startsWith("📦") ? "text-blue-400 mb-2" :
                  "text-gray-400"
                }
              >
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
