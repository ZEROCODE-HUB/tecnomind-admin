import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Eye, Shield, Lightbulb } from "lucide-react";
import aboutMissionImage from "@/assets/about-mission.png";

const About = () => {
  const values = [
    {
      icon: Eye,
      title: "Transparencia",
      description: "Sin letras chicas ni comisiones ocultas. Sabes exactamente lo que pagas.",
    },
    {
      icon: Shield,
      title: "Seguridad",
      description: "Protección de grado bancario para tus fondos y datos personales.",
    },
    {
      icon: Lightbulb,
      title: "Innovación",
      description: "Mejoramos constantemente nuestra plataforma escuchando a nuestros usuarios.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Transformando las finanzas de Argentina.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            En Magnate, creemos que gestionar tu dinero debe ser tan simple como enviar un mensaje. 
            Tecnología financiera al servicio de los emprendedores.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Visual Block */}
            <div className="order-2 md:order-1">
              <div className="aspect-square max-w-md mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
                <img 
                  src={aboutMissionImage} 
                  alt="Seguridad, eficacia y emprendedores - Valores de Magnate" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Nuestra Misión
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Nacimos con el objetivo de eliminar las barreras burocráticas del sistema bancario tradicional. 
                Queremos empoderar a comercios, pymes y personas con herramientas de cobro y pago instantáneas, 
                seguras y accesibles las 24 horas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12 lg:mb-16">
            Nuestros Valores
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            ¿Listo para sumarte?
          </h2>
          <Link to="/login">
            <Button size="lg" className="text-base px-8">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
