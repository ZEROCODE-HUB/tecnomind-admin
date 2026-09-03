import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, MoreHorizontal, ChevronDown, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { TecnoMindWordmark } from "./tecnomind-wordmark";
import type { Resource } from "@tecnomind/core";
import { useDemoMode } from "@/contexts/demo-mode";
import { useAuth } from "@/contexts/auth";

/** `recurso` es el codigo de backoffice_resources que gobierna el acceso. */
export type NavLeaf = { to: string; label: string; icon: LucideIcon; recurso?: Resource };
export type NavGroup = { label: string; icon: LucideIcon; items: NavLeaf[]; recurso?: Resource };
export type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => (item as NavGroup).items !== undefined;

const isActive = (to: string, path: string): boolean => {
  if (path === to) return true;
  if (path === `${to}/`) return true;
  if (to !== "/admin" && path.startsWith(`${to}/`)) return true;
  return false;
};

export function PortalShell({
  nav,
  title,
  children,
}: {
  nav: NavItem[];
  title: string;
  children: ReactNode;
}) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const { setRole } = useDemoMode();
  const { operador, signOut } = useAuth();
  const navigate = useNavigate();

  // Iniciales del operador para el avatar; "?" mientras carga el perfil.
  const iniciales =
    operador?.nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  // La barra inferior móvil prioriza los módulos (grupos) sobre las rutas sueltas.
  const mainNav: NavGroup[] = nav.filter(isGroup).slice(0, 4);
  const more = nav.filter(isGroup).slice(4);

  // Cerrar sesion tiene que salir de Supabase, no solo cambiar el estado
  // local: sin el signOut el token seguia vivo y volver por URL entraba.
  const onLogout = async () => {
    await signOut();
    setRole(null);
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header superior */}
      <header className="h-14 border-b border-black-100 bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2 text-black-600 hover:text-black-800"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <Link to="/admin" aria-label="Ir al panel general">
            <TecnoMindWordmark size={20} />
          </Link>
          <span className="hidden md:inline text-sm text-black-400 border-l border-black-100 pl-3 ml-1">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs text-black-400">
              {operador?.roles.join(" · ") || "Sesión"}
            </span>
            <span className="text-sm font-semibold text-black-700">
              {operador?.nombre ?? "…"}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-red-50 text-red-500"
            title={operador?.email}
          >
            {iniciales}
          </div>
          <button
            onClick={onLogout}
            className="hidden md:inline-flex items-center gap-1 text-xs text-black-400 hover:text-black-700 transition-colors"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-navy-600 bg-[#1c2e4a] shrink-0">
          <div className="flex justify-center px-5 pt-6 pb-5 border-b border-navy-600">
            <Link to="/admin" aria-label="Ir al panel general">
              <TecnoMindWordmark size={30} variant="white" />
            </Link>
          </div>
          <nav className="p-3 flex-1 overflow-y-auto">
            <SidebarNav nav={nav} path={path} />
          </nav>
        </aside>

        {/* Drawer mobile */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#1c2e4a] border-r border-navy-600 flex flex-col">
              <div className="flex justify-center p-4 border-b border-navy-600">
                <TecnoMindWordmark size={24} variant="white" />
              </div>
              <nav className="p-3 flex-1 overflow-y-auto">
                <SidebarNav nav={nav} path={path} onNavigate={() => setOpen(false)} />
              </nav>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:px-10 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-black-100 flex items-stretch z-30">
        {mainNav.map((mod) => {
          const Icon = mod.icon;
          const active = mod.items.some((i) => isActive(i.to, path));
          return (
            <button
              key={mod.label}
              onClick={() => setOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "text-moli-orange font-semibold" : "text-black-400 hover:text-moli-orange"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span className="truncate px-1">{mod.label}</span>
            </button>
          );
        })}
        {more.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-black-400"
          >
            <MoreHorizontal size={20} strokeWidth={1.75} />
            <span>Más</span>
          </button>
        )}
      </nav>
    </div>
  );
}

function SidebarNav({
  nav,
  path,
  onNavigate,
}: {
  nav: NavItem[];
  path: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {nav.map((item, idx) =>
        isGroup(item) ? (
          <SidebarGroup
            key={`g-${idx}-${item.label}`}
            group={item}
            path={path}
            onNavigate={onNavigate}
          />
        ) : (
          <SidebarLink
            key={item.to}
            item={item}
            active={isActive(item.to, path)}
            onNavigate={onNavigate}
          />
        ),
      )}
    </>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
  nested = false,
}: {
  item: NavLeaf;
  active: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm mb-0.5 transition-colors ${
        nested ? "pl-9" : ""
      } ${
        nested
          ? active
            ? "bg-moli-orange-dark text-white font-semibold"
            : "text-white/60 hover:text-moli-orange hover:bg-moli-orange/10"
          : active
            ? "bg-moli-orange text-white font-semibold"
            : "text-white/80 hover:text-moli-orange hover:bg-moli-orange/10"
      }`}
    >
      {!nested && <Icon size={18} strokeWidth={1.75} />}
      {nested && <Icon size={15} strokeWidth={1.75} className="opacity-70" />}
      {item.label}
    </Link>
  );
}

function SidebarGroup({
  group,
  path,
  onNavigate,
}: {
  group: NavGroup;
  path: string;
  onNavigate?: () => void;
}) {
  const containsActive = group.items.some((i) => isActive(i.to, path));
  const [open, setOpen] = useState(containsActive);
  const Icon = group.icon;
  const expanded = open || containsActive;
  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
          containsActive
            ? "text-moli-orange font-semibold"
            : "text-white/80 hover:text-moli-orange hover:bg-moli-orange/10"
        }`}
        aria-expanded={expanded}
      >
        <Icon size={18} strokeWidth={1.75} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-0.5">
          {group.items.map((it) => (
            <SidebarLink
              key={it.to}
              item={it}
              active={isActive(it.to, path)}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Utility primitives used by pages */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>{children}</div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-xl md:text-2xl font-semibold text-foreground mt-1 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

export function BtnPrimary({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark active:bg-moli-red-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function BtnOutline({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={`w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20 ${p.className ?? ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-foreground mb-1.5 block">
      {children}
    </label>
  );
}

const badgeStyles: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  danger: "bg-moli-red-light text-moli-red-dark dark:bg-red-950/30 dark:text-red-400",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
