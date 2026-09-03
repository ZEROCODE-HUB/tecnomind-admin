import { Building2, Receipt } from "lucide-react";

const SolutionsSection = () => {
  const solutions = [
    {
      icon: Building2,
      title: "Tu CVU de Negocios",
      description: "Profesionalizá tu emprendimiento. Obtené un CVU exclusivo para separar tus finanzas personales de la caja de tu empresa.",
      features: ["Sin costo de adhesión", "Activación inmediata", "Panel de control en tiempo real"],
    },
    {
      icon: Receipt,
      title: "Análisis de Gastos",
      description: "Visualizá tus movimientos con gráficos interactivos. Entendé dónde va tu dinero y optimizá tus costos operativos.",
      features: ["Reportes detallados", "Categorización automática", "Exportación de datos"],
    }
  ];

  return (
    <section id="soluciones" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-4">
            Soluciones
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Todo lo que tu startup necesita para crecer
          </h2>
          <p className="text-lg text-muted-foreground">
            Herramientas diseñadas específicamente para emprendedores argentinos
            que buscan escalar sus operaciones financieras.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {solutions.map((solution) => (
            <div
              key={solution.title}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-elevated h-full flex flex-col"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 md:p-8 pb-6">
                {/* Icon + Title row on mobile */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <solution.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {solution.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[4.5rem]">
                  {solution.description}
                </p>
              </div>

              {/* Features */}
              <div className="p-8 pt-6 pb-8 flex-1">
                <ul className="space-y-3">
                  {solution.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
