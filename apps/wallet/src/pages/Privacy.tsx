import { Navbar, Footer } from "@/components/landing";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Política de Privacidad de Datos - Magnate
            </h1>
            <p className="text-sm text-slate-500">
              Última actualización: Diciembre 2024
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Compromiso de Privacidad
              </h2>
              <p className="text-slate-700 leading-relaxed">
                En cumplimiento de la Ley Nacional N° 25.326 de Protección de Datos Personales, 
                Magnate se compromete a proteger la privacidad de sus usuarios.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Recolección de Información
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Recopilamos datos personales (DNI, CUIT/CUIL, datos biométricos) únicamente 
                con fines operativos, de seguridad y para cumplir con las regulaciones del 
                BCRA y la AFIP.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. Uso de la Información
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Sus datos serán utilizados para:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Validar su identidad (Onboarding digital).</li>
                <li>Procesar transacciones financieras.</li>
                <li>Prevenir fraudes y estafas.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Compartir Información con Terceros
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Magnate no vende sus datos. Solo compartimos información con proveedores de 
                infraestructura (ej: procesadores de pago) o autoridades competentes cuando 
                exista requerimiento judicial o normativa obligatoria.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Derechos ARCO
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Como titular de los datos, usted tiene la facultad de ejercer el derecho de 
                acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, 
                salvo que se acredite un interés legítimo al efecto conforme lo establecido 
                en el artículo 14, inciso 3 de la Ley Nº 25.326. La Dirección Nacional de 
                Protección de Datos Personales tiene la atribución de atender las denuncias 
                y reclamos que se interpongan con relación al incumplimiento de las normas 
                sobre protección de datos personales.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
