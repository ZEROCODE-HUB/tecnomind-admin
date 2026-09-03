import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const links = {
    producto: [
      { label: "Billetera Virtual", href: "/login" },
      { label: "APIs", href: "/apis-wiki" },
    ],
    empresa: [
      { label: "Nosotros", href: "/about" },
    ],
    legal: [
      { label: "Términos y Condiciones", href: "/terms" },
      { label: "Política de Privacidad", href: "/privacy" },
    ],
  };

  return (
    <footer className="bg-[#0A2540] text-white">
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <div className="mb-6">
              <Logo className="h-8 [&_span]:text-lg [&_span]:text-white" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-sm">
              La billetera virtual diseñada para emprendedores argentinos.
              Seguridad, velocidad y las mejores herramientas para tu negocio.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4" />
                <span>Buenos Aires, Argentina</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Mail className="w-4 h-4" />
                <span>hola@magnate.com.ar</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Phone className="w-4 h-4" />
                <span>+54 11 5555-0000</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-3">
              {links.producto.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              {links.empresa.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">
              © 2024 Magnate. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-white/40">
                Regulado por el BCRA
              </span>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-xs text-white/40">
                PSP Autorizado
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
