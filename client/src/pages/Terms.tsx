import { Link } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fixopolis</h1>
            <p className="text-sm text-gray-500">Términos de Servicio</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de Servicio</h1>
            <p className="text-gray-500 text-sm">Última actualización: 31 de julio de 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">1. Aceptación de los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Al utilizar los servicios de Fixopolis ("nosotros", "nuestro" o "la empresa"), usted acepta estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no utilice nuestros servicios.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">2. Descripción del Servicio</h2>
            <p className="text-gray-600 leading-relaxed">
              Fixopolis es un servicio de reparación de dispositivos móviles y electrónicos. Nuestros servicios incluyen diagnóstico, reparación y mantenimiento de teléfonos inteligentes, tabletas y otros dispositivos electrónicos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">3. Proceso de Reparación</h2>
            <p className="text-gray-600 leading-relaxed">
              Al dejar su dispositivo para reparación, usted acepta lo siguiente:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Proporcionar información precisa sobre el problema del dispositivo</li>
              <li>Autorizar a nuestros técnicos a diagnosticar y reparar el dispositivo según lo acordado</li>
              <li>Recoger el dispositivo dentro de los 30 días posteriores a la notificación de completado</li>
              <li>Realizar el pago acordado al momento de recoger el dispositivo</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">4. Garantía de Reparación</h2>
            <p className="text-gray-600 leading-relaxed">
              Ofrecemos garantía en nuestras reparaciones bajo las siguientes condiciones:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>La garantía cubre defectos en las partes instaladas y la mano de obra</li>
              <li>El período de garantía estándar es de 30 días desde la fecha de entrega</li>
              <li>La garantía no cubre daños por agua, caídas, o mal uso posterior a la reparación</li>
              <li>La garantía es nula si el dispositivo es abierto o modificado por terceros</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">5. Responsabilidad</h2>
            <p className="text-gray-600 leading-relaxed">
              Fixopolis tomará todas las precauciones razonables para proteger su dispositivo durante el proceso de reparación. Sin embargo:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>No somos responsables por la pérdida de datos almacenados en el dispositivo. Se recomienda realizar una copia de seguridad antes de dejar el dispositivo</li>
              <li>No somos responsables por daños preexistentes no relacionados con la reparación solicitada</li>
              <li>Nuestra responsabilidad máxima se limita al costo de la reparación realizada</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">6. Comunicaciones por SMS</h2>
            <p className="text-gray-600 leading-relaxed">
              Al proporcionar su número de teléfono, usted consiente recibir mensajes de texto (SMS) de Fixopolis con actualizaciones sobre el estado de su reparación. Puede optar por no recibir estos mensajes respondiendo STOP en cualquier momento. Pueden aplicar tarifas de mensajes y datos de su operador.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">7. Dispositivos No Reclamados</h2>
            <p className="text-gray-600 leading-relaxed">
              Los dispositivos no reclamados después de 60 días de la notificación de completado podrán ser considerados abandonados. Fixopolis se reserva el derecho de disponer de dichos dispositivos de acuerdo con las leyes locales aplicables.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">8. Precios y Pagos</h2>
            <p className="text-gray-600 leading-relaxed">
              Los precios de reparación se proporcionan como estimados y pueden variar según el diagnóstico final. Cualquier cambio en el precio será comunicado al cliente antes de proceder. Aceptamos efectivo y tarjetas de crédito/débito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">9. Modificaciones a los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios entrarán en vigor al ser publicados en nuestro sitio web. El uso continuado de nuestros servicios constituye la aceptación de los términos modificados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">10. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Para preguntas sobre estos Términos de Servicio, contáctenos:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-600">
              <p><strong>Fixopolis Solutions</strong></p>
              <p>Teléfono: +1 (567) 472-2954</p>
              <p>Sitio web: fixopolisfinanzas.com</p>
            </div>
          </section>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-400 text-center">
              Al utilizar nuestros servicios, usted confirma haber leído, entendido y aceptado estos Términos de Servicio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
