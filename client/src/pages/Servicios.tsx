import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Wrench, DollarSign, ToggleLeft, ToggleRight, Image as ImageIcon } from "lucide-react";

interface Service {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number | string;
  activo: number | boolean;
  imagen?: string;
}

interface ServiceFormData {
  nombre: string;
  descripcion: string;
  precio: string;
  activo: boolean;
  imagen: string;
}

const EMPTY_FORM: ServiceFormData = {
  nombre: "",
  descripcion: "",
  precio: "",
  activo: true,
  imagen: "",
};

export default function Servicios() {
  const { data: services = [], refetch, isLoading } = trpc.posServices.list.useQuery();
  const createMutation = trpc.posServices.create.useMutation({ onSuccess: () => { refetch(); setShowModal(false); } });
  const updateMutation = trpc.posServices.update.useMutation({ onSuccess: () => { refetch(); setShowModal(false); } });
  const deleteMutation = trpc.posServices.delete.useMutation({ onSuccess: () => refetch() });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      nombre: svc.nombre,
      descripcion: svc.descripcion || "",
      precio: String(svc.precio),
      activo: Boolean(svc.activo),
      imagen: svc.imagen || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const precio = parseFloat(form.precio);
    if (!form.nombre.trim() || isNaN(precio) || precio < 0) return;
    if (editingId !== null) {
      await updateMutation.mutateAsync({
        id: editingId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio,
        activo: form.activo,
        imagen: form.imagen.trim() || undefined,
      });
    } else {
      await createMutation.mutateAsync({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio,
        activo: form.activo,
        imagen: form.imagen.trim() || undefined,
      });
    }
  };

  const handleToggleActive = async (svc: Service) => {
    await updateMutation.mutateAsync({ id: svc.id, activo: !svc.activo });
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    setDeleteConfirm(null);
  };

  const activeCount = services.filter((s: Service) => s.activo).length;
  const totalValue = services.reduce((sum: number, s: Service) => sum + parseFloat(String(s.precio)), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="text-orange-400" size={24} />
            Gestión de Servicios
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Administra los servicios disponibles en el POS
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Agregar Servicio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Servicios</p>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Activos en POS</p>
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Precio Promedio</p>
          <p className="text-2xl font-bold text-orange-400">
            ${services.length > 0 ? (totalValue / services.length).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Wrench size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No hay servicios registrados</p>
          <p className="text-sm mt-1">Agrega tu primer servicio con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((svc: Service) => (
            <div
              key={svc.id}
              className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${
                svc.activo ? "border-gray-700" : "border-gray-700/40 opacity-60"
              }`}
            >
              {/* Image */}
              <div className="h-32 bg-gray-700 flex items-center justify-center overflow-hidden">
                {svc.imagen ? (
                  <img src={svc.imagen} alt={svc.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-500">
                    <Wrench size={28} />
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white text-sm leading-tight flex-1 pr-2">{svc.nombre}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    svc.activo ? "bg-green-500/20 text-green-400" : "bg-gray-600/40 text-gray-400"
                  }`}>
                    {svc.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {svc.descripcion && (
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">{svc.descripcion}</p>
                )}

                <div className="flex items-center gap-1 mb-3">
                  <DollarSign size={14} className="text-orange-400" />
                  <span className="text-orange-400 font-bold text-lg">
                    ${parseFloat(String(svc.precio)).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(svc)}
                    className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(svc)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      svc.activo
                        ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-400"
                    }`}
                    title={svc.activo ? "Desactivar" : "Activar"}
                  >
                    {svc.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(svc.id)}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-lg font-bold mb-4">
              {editingId !== null ? "Editar Servicio" : "Nuevo Servicio"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del servicio *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Ej: Cambio de pantalla"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción (opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                  rows={2}
                  placeholder="Descripción breve del servicio"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Precio *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  <ImageIcon size={14} className="inline mr-1" />
                  URL de imagen (opcional)
                </label>
                <input
                  type="text"
                  value={form.imagen}
                  onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="https://..."
                />
                {form.imagen && (
                  <img src={form.imagen} alt="preview" className="mt-2 h-16 w-full object-cover rounded-lg" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.activo ? "bg-green-500" : "bg-gray-600"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.activo ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-gray-300">
                  {form.activo ? "Visible en el POS" : "Oculto en el POS"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            <h2 className="text-lg font-bold mb-2 text-red-400">¿Eliminar servicio?</h2>
            <p className="text-gray-400 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
