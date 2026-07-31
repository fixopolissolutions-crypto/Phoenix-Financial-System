import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fixopolis</h1>
            <p className="text-sm text-gray-500">Política de Privacidad</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/">
          <a className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
            <p className="text-gray-500 text-sm">Última actualización: 31 de julio de 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">1. Información que Recopilamos</h2>
            <p className="text-gray-600 leading-relaxed">
              En Fixopolis ("nosotros", "nuestro" o "la empresa"), recopilamos información personal que usted nos proporciona directamente cuando trae su dispositivo para reparación, incluyendo:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Nombre completo</li>
              <li>Número de teléfono</li>
              <li>Dirección de correo electrónico (opcional)</li>
              <li>Información del dispositivo (marca, modelo, IMEI)</li>
              <li>Descripción del problema reportado</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">2. Cómo Usamos su Información</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos la información recopilada para los siguientes propósitos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Procesar y gestionar las órdenes de reparación de su dispositivo</li>
              <li>Enviarle notificaciones de texto (SMS) sobre el estado de su reparación</li>
              <li>Contactarle para informarle cuando su dispositivo esté listo para recoger</li>
              <li>Mantener un historial de reparaciones para garantías futuras</li>
              <li>Mejorar nuestros servicios de atención al cliente</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">3. Notificaciones por Mensaje de Texto (SMS)</h2>
            <p className="text-gray-600 leading-relaxed">
              Al proporcionar su número de teléfono, usted consiente recibir mensajes de texto (SMS) de Fixopolis relacionados con el estado de su reparación. Estos mensajes incluyen:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Confirmación de recepción de su dispositivo</li>
              <li>Actualizaciones de estado durante el proceso de reparación</li>
              <li>Notificación cuando su dispositivo esté listo para recoger</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              <strong>Frecuencia de mensajes:</strong> Recibirá entre 1 y 5 mensajes por orden de reparación. Pueden aplicar tarifas de mensajes y datos de su operador. Para dejar de recibir mensajes, responda STOP en cualquier momento. Para obtener ayuda, responda HELP.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">4. Compartir Información con Terceros</h2>
            <p className="text-gray-600 leading-relaxed">
              No vendemos, alquilamos ni compartimos su información personal con terceros para fines de marketing. Podemos compartir su información únicamente con:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Twilio Inc.:</strong> Proveedor de servicios de mensajería SMS, para el envío de notificaciones de estado</li>
              <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley o proceso legal</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">5. Seguridad de la Información</h2>
            <p className="text-gray-600 leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Su información se almacena en servidores seguros con acceso restringido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">6. Retención de Datos</h2>
            <p className="text-gray-600 leading-relaxed">
              Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos descritos en esta política, incluyendo el período de garantía de su reparación (generalmente 30 días) y por un período adicional de hasta 2 años para fines de historial de servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">7. Sus Derechos</h2>
            <p className="text-gray-600 leading-relaxed">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Acceder a la información personal que tenemos sobre usted</li>
              <li>Solicitar la corrección de información inexacta</li>
              <li>Solicitar la eliminación de su información personal</li>
              <li>Optar por no recibir comunicaciones de marketing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">8. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, puede contactarnos:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-600">
              <p><strong>Fixopolis Solutions</strong></p>
              <p>Teléfono: +1 (567) 472-2954</p>
              <p>Sitio web: fixopolisfinanzas.com</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">9. Cambios a esta Política</h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios significativos publicando la nueva política en nuestro sitio web con una fecha de actualización revisada.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
