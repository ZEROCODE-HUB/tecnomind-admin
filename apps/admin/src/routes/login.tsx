import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

import { TecnoMindLogo } from "@/components/tecnomind-logo";
import { BtnPrimary } from "@/components/portal-shell";
import { useAuth } from "@/contexts/auth";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, session, hasAccess, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesión con acceso, no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (!loading && session && hasAccess) {
      void navigate({ to: redirect ?? "/admin" });
    }
  }, [loading, session, hasAccess, navigate, redirect]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  }

  // Sesión válida pero sin ningún permiso: el problema no son las
  // credenciales, es que a esta cuenta no le asignaron un rol.
  const sinPermisos = !loading && session && !hasAccess;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <TecnoMindLogo size={56} />
          <h1 className="font-display mt-6 text-xl font-semibold text-foreground">
            Panel administrativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá con tu cuenta de operador.
          </p>
        </div>

        {sinPermisos ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium text-foreground">
              Tu cuenta no tiene acceso al backoffice
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Iniciaste sesión correctamente, pero todavía no se te asignó un rol.
              Pedile a un administrador que te lo asigne.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-border bg-card p-6"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="operador@tecnomind.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <BtnPrimary type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </BtnPrimary>
          </form>
        )}
      </div>
    </div>
  );
}
