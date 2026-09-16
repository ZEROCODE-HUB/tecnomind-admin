import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export type ActionItem = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "danger";
};

type ActionsDropdownProps = {
  actions: ActionItem[];
};

const MENU_WIDTH = 184;

/**
 * Menú de acciones (los "3 puntitos").
 *
 * El menú se renderiza en un PORTAL a document.body con position: fixed. Antes
 * se posicionaba absolute dentro de la fila, y como el contenedor de la tabla
 * tiene overflow (scroll horizontal), el menú quedaba RECORTADO/por debajo del
 * contenedor. Con el portal escapa de cualquier overflow o stacking context.
 */
export function ActionsDropdown({ actions }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const gap = 4;
    let left = b.right - MENU_WIDTH; // alineado a la derecha del botón
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - 8 - MENU_WIDTH;
    const menuH = Math.min(actions.length * 36 + 8, 320);
    let top = b.bottom + gap;
    // Si no entra abajo, se abre hacia arriba.
    if (top + menuH > window.innerHeight - 8) top = Math.max(8, b.top - gap - menuH);
    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    // Al hacer scroll/resize el botón se mueve; se cierra para no dejar el menú suelto.
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-md hover:bg-muted transition-colors"
        aria-label="Acciones"
      >
        <MoreHorizontal size={16} />
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH, zIndex: 9999 }}
            className="bg-card border rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-muted ${
                    action.variant === "danger" ? "text-red-600" : "text-foreground"
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  {action.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
