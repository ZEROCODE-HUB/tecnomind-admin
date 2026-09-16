import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, AlertCircle, X, UserPlus, KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Card, Badge, BtnPrimary, Input } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/contexts/auth";
import { mensajeError } from "@/lib/clientes";
import {
  useOperadores,
  useRolesDisponibles,
  useCrearOperador,
  useQuitarRol,
} from "@/lib/operadores";

export const Route = createFileRoute("/admin/administracion/usuarios/operadores")({
  component: OperadoresPage,
});

function OperadoresPage() {
  const { can } = useAuth();
  const puedeGestionar = can("backoffice", "update");

  const operadoresQuery = useOperadores();
  const rolesQuery = useRolesDisponibles();
  const crear = useCrearOperador();
  const quitar = useQuitarRol();

  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [roleCode, setRoleCode] = useState("");
  // Credencial temporal del último operador creado (se muestra una vez).
  const [cred, setCred] = useState<{ email: string; password: string } | null>(null);

  const roles = rolesQuery.data ?? [];
  const operadores = operadoresQuery.data ?? [];

  const handleAgregar = () => {
    const correo = email.trim();
    const rol = roleCode || roles[0]?.code;
    if (!correo || !rol) {
      toast.warning("Indicá un correo y un rol.");
      return;
    }
    crear.mutate(
      { email: correo, roleCode: rol, nombre },
      {
        onSuccess: (res) => {
          setEmail("");
          setNombre("");
          if (res.creado && res.tempPassword) {
            setCred({ email: correo, password: res.tempPassword });
            toast.success(`Operador ${correo} creado`);
          } else {
            toast.success(`Rol asignado a ${correo}`);
          }
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operadores"
        description="Personas del equipo con acceso al backoffice y los roles que tienen asignados."
      />

      {puedeGestionar && (
        <Card className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-moli-blue" />
            <h3 className="font-display font-semibold">Agregar operador</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Se crea con una contraseña temporal (no necesita registrarse en la app). Si el correo
            ya existe, solo se le asigna el rol.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Nombre (opcional)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="flex-1"
            />
            <select
              value={roleCode || roles[0]?.code || ""}
              onChange={(e) => setRoleCode(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/20 sm:w-52"
            >
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
            <BtnPrimary onClick={handleAgregar} disabled={crear.isPending}>
              {crear.isPending && <Loader2 size={14} className="animate-spin" />}
              Agregar
            </BtnPrimary>
          </div>

          {cred && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <KeyRound size={15} /> Operador creado — contraseña temporal
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                Compartísela a <span className="font-mono">{cred.email}</span>. No se vuelve a
                mostrar; que la cambie al entrar.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded bg-white/70 dark:bg-black/30 px-2 py-1 font-mono text-sm">
                  {cred.password}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(cred.password);
                    toast.success("Contraseña copiada");
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent"
                >
                  <Copy size={13} /> Copiar
                </button>
                <button
                  type="button"
                  onClick={() => setCred(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {operadoresQuery.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : operadoresQuery.isError ? (
        <Card>
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <AlertCircle size={22} className="text-destructive" />
            <p className="text-sm font-semibold">No se pudo cargar la lista de operadores</p>
            <p className="text-sm text-muted-foreground">{mensajeError(operadoresQuery.error)}</p>
          </div>
        </Card>
      ) : operadores.length === 0 ? (
        <Card>
          <EmptyState title="Sin operadores" description="Todavía no hay personas con acceso al backoffice." />
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-display font-semibold">Operador</th>
                <th className="px-4 py-2.5 font-display font-semibold">Roles</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((op) => (
                <tr key={op.userId} className="border-b last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{op.fullName}</div>
                    <div className="text-xs text-muted-foreground">{op.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {op.roleNames.map((name, i) => {
                        const code = op.roleCodes[i];
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                          >
                            {name}
                            {puedeGestionar && (
                              <button
                                type="button"
                                aria-label={`Quitar ${name}`}
                                disabled={quitar.isPending}
                                onClick={() =>
                                  quitar.mutate(
                                    { userId: op.userId, roleCode: code },
                                    {
                                      onSuccess: () => toast.success(`Rol "${name}" quitado`),
                                      onError: (e) => toast.error(mensajeError(e)),
                                    },
                                  )
                                }
                                className="hover:text-destructive transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {op.roleNames.length === 0 && <Badge tone="neutral">Sin roles</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
