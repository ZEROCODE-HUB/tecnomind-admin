import { Navbar, Footer } from "@/components/landing";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
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
              Términos y Condiciones de Uso de Magnate
            </h1>
            <p className="text-sm text-slate-500">
              Última actualización: Diciembre 2024
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Aceptación
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Al registrarse y utilizar la billetera virtual "Magnate", usted acepta 
                los presentes términos bajo la normativa vigente de la República Argentina. 
                Magnate opera como Proveedor de Servicios de Pago (PSP) registrado ante el 
                Banco Central de la República Argentina (BCRA).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Funcionalidad del Servicio
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Magnate permite la gestión de fondos, transferencias vía CVU/CBU y pagos 
                con QR interoperable (Transferencias 3.0). Los fondos en la cuenta de pago 
                no constituyen depósitos en una entidad financiera ni cuentan con las 
                garantías de tales depósitos.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. Obligaciones del Usuario
              </h2>
              <p className="text-slate-700 leading-relaxed">
                El usuario declara bajo juramento que los fondos ingresados provienen de 
                actividades lícitas y se obliga a mantener actualizada su información 
                personal conforme a las normativas de "Conozca a su Cliente" (KYC) y 
                prevención de lavado de activos (UIF).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Responsabilidad
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Magnate no se responsabiliza por fallas en el sistema bancario nacional 
                (COELSA) o interrupciones de servicios de terceros.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Jurisdicción
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Para cualquier controversia, las partes se someten a la jurisdicción de 
                los Tribunales Ordinarios en lo Comercial de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
