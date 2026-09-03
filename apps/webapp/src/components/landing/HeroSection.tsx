import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-success/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 pt-32 lg:pt-40 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-white/80">
                Plataforma operativa 24/7
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              La infraestructura financiera que tu negocio merece.
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Gestioná cobros, pagos y transferencias con la mayor velocidad del mercado.
              Una plataforma robusta diseñada para la agilidad de las startups argentinas.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" className="group" onClick={() => navigate("/login")}>
                Comenzar ahora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Mockup Visual */}
          <div className="relative animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative z-10">
              {/* Laptop Mockup */}
              <div className="relative mx-auto max-w-lg">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-elevated">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <div className="flex-1 bg-white/10 rounded-md h-6 flex items-center px-3">
                      <span className="text-xs text-white/50">app.magnate.com.ar</span>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="bg-background rounded-xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Buenos días,</p>
                        <p className="text-xl font-semibold text-foreground">Hola, Santiago</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-accent font-semibold">S</span>
                      </div>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 text-primary-foreground">
                      <p className="text-sm opacity-80 mb-1">Saldo disponible</p>
                      <p className="text-3xl font-bold">$ 1.250.400,00</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-success/20 text-success rounded-full">
                          +12.5% este mes
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-3">
                      {['Transferir', 'Cobrar', 'Historial'].map((action) => (
                        <div key={action} className="bg-secondary rounded-lg p-3 text-center hover:bg-accent/10 transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-foreground">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
