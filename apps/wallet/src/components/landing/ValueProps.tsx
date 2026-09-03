import { Shield, Building2, Zap } from "lucide-react";

const ValueProps = () => {
  const values = [
    {
      icon: Shield,
      title: "Seguridad Total",
      description: "Acceso protegido por biometría y PIN virtual para máxima tranquilidad. Tus fondos están resguardados con los más altos estándares del mercado.",
      color: "accent"
    },
    {
      icon: Building2,
      title: "Confianza Institucional",
      description: "Gestión transparente de fondos y cumplimiento normativo. Operamos bajo todas las regulaciones del BCRA para brindarte total respaldo.",
      color: "primary"
    },
    {
      icon: Zap,
      title: "Eficacia Operativa",
      description: "Transferencias inmediatas a cualquier CBU/CVU y cobros ágiles. Tu dinero se mueve tan rápido como tu negocio lo necesita.",
      color: "success"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'accent':
        return {
          bg: 'bg-accent/10',
          icon: 'text-accent',
          border: 'group-hover:border-accent/30'
        };
      case 'success':
        return {
          bg: 'bg-success/10',
          icon: 'text-success',
          border: 'group-hover:border-success/30'
        };
      default:
        return {
          bg: 'bg-primary/10',
          icon: 'text-primary',
          border: 'group-hover:border-primary/30'
        };
    }
  };

  return (
    <section id="seguridad" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-4">
            Nuestra propuesta
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Los pilares de una billetera de clase mundial
          </h2>
          <p className="text-lg text-muted-foreground">
            Diseñada para emprendedores que exigen lo mejor: seguridad sin compromisos, 
            confianza institucional y la velocidad que tu negocio necesita.
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const colors = getColorClasses(value.color);
            return (
              <div
                key={value.title}
                className={`group relative bg-card rounded-2xl p-8 border border-border transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 ${colors.border}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6`}>
                  <value.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>

                {/* Decorative gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
