import { useState } from "react";
import { Navbar, Footer } from "@/components/landing";
import { cn } from "@/lib/utils";
import { ChevronRight, Copy, Check } from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "auth", label: "1. Autenticación" },
  { id: "movements", label: "2. Ver Movimientos" },
  { id: "transfer", label: "3. Realizar Transferencia" },
];

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-slate-100 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

const EndpointBadge = ({ method }: { method: "GET" | "POST" }) => {
  const colors = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <span className={cn("px-2 py-1 text-xs font-bold rounded border", colors[method])}>
      {method}
    </span>
  );
};

const ApisWiki = () => {
  const [activeSection, setActiveSection] = useState("auth");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border bg-muted/30 sticky top-0 h-screen pt-20">
          <nav className="p-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Contenido
            </h3>
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                      activeSection === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      activeSection === item.id && "rotate-90"
                    )} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-20">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                v1.0
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Documentación de API Magnate
              </h1>
              <p className="text-lg text-muted-foreground">
                Integra tu negocio con nuestra API RESTful. Autenticación segura, consulta de movimientos y transferencias programáticas.
              </p>
            </div>

            {/* Section 1: Autenticación */}
            <section id="auth" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">1</span>
                Autenticación
              </h2>
              <p className="text-muted-foreground mb-6">
                Obtén tu token de acceso para operar con la API. El token expira después de 1 hora.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <EndpointBadge method="POST" />
                  <code className="text-sm font-mono text-foreground">/api/v1/auth/login</code>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    code={`{
  "username": "tu_usuario",
  "password": "tu_password"
}`}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Respuesta <span className="text-emerald-500">200 OK</span>
                  </h4>
                  <CodeBlock
                    code={`{
  "token": "eyJhbGciOiJIUz...",
  "expires_in": 3600
}`}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Ver Movimientos */}
            <section id="movements" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">2</span>
                Ver Movimientos
              </h2>
              <p className="text-muted-foreground mb-6">
                Consulta el historial de transacciones de tu cuenta.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <EndpointBadge method="GET" />
                  <code className="text-sm font-mono text-foreground">/api/v1/transactions</code>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Headers requeridos</h4>
                  <code className="text-sm font-mono text-foreground">Authorization: Bearer {"{token}"}</code>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Respuesta <span className="text-emerald-500">200 OK</span>
                  </h4>
                  <CodeBlock
                    code={`[
  {
    "id": "tx_123",
    "type": "transfer_in",
    "amount": 15000.00,
    "date": "2024-12-30T10:00:00Z",
    "status": "completed"
  }
]`}
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Realizar Transferencia */}
            <section id="transfer" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">3</span>
                Realizar Transferencia
              </h2>
              <p className="text-muted-foreground mb-6">
                Envía dinero a un CVU o Alias de forma programática.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                  <EndpointBadge method="POST" />
                  <code className="text-sm font-mono text-foreground">/api/v1/transfers</code>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Headers requeridos</h4>
                  <code className="text-sm font-mono text-foreground">Authorization: Bearer {"{token}"}</code>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    code={`{
  "destination": "alias.banco.destino",
  "amount": 5000.50,
  "concept": "Varios"
}`}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Respuesta <span className="text-emerald-500">201 Created</span>
                  </h4>
                  <CodeBlock
                    code={`{
  "status": "processing",
  "transaction_id": "tx_999"
}`}
                  />
                </div>
              </div>
            </section>

            {/* Help Section */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <h3 className="text-lg font-semibold text-foreground mb-2">¿Necesitás ayuda?</h3>
              <p className="text-muted-foreground text-sm">
                Si tenés dudas sobre la integración, contactanos a{" "}
                <a href="mailto:soporte@magnate.com" className="text-primary hover:underline">
                  soporte@magnate.com
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ApisWiki;
