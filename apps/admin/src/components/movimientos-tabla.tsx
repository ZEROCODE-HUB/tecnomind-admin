import { useState } from "react";
import { Eye, Loader2, AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/portal-shell";
import { DetailModal, estadoBadge } from "@/components/movimiento-detail";
import { formatARS, formatFechaHora, formatCuit, mensajeError } from "@/lib/clientes";
import { useMovimientos, type Grupo, type Movimiento } from "@/lib/movimientos";

/**
 * Tabla de movimientos, compartida por las ocho pantallas de la sección.
 *
 * Todas mostraban exactamente las mismas columnas sobre distintos
 * subconjuntos: la única diferencia real es el filtro por tipo. Se
 * unifican acá para que un cambio de columna no haya que repetirlo ocho
 * veces.
 */
export function MovimientosTabla({
  titulo,
  descripcion,
  grupo,
}: {
  titulo: string;
  descripcion: string;
  grupo: Grupo;
}) {
  const query = useMovimientos(grupo);
  const [detail, setDetail] = useState<Movimiento | null>(null);
  const movimientos = query.data ?? [];

  const columns: Column<Movimiento>[] = [
    {
      key: "referencia",
      label: "Referencia",
      filterable: true,
      render: (m) => <span className="font-mono tabular-nums text-xs">{m.referencia}</span>,
    },
    {
      key: "tipo",
      label: "Tipo de movimiento",
      filterable: "enum",
      filterOptions: [...new Set(movimientos.map((m) => m.tipo))],
      render: (m) => m.tipo,
    },
    {
      key: "origenNombre",
      label: "Origen",
      filterable: true,
      render: (m) => (
        <div>
          <div>{m.origenNombre ?? "—"}</div>
          {m.origenCvu && (
            <div className="text-xs text-muted-foreground font-mono">{m.origenCvu}</div>
          )}
        </div>
      ),
    },
    {
      key: "destinoNombre",
      label: "Destino",
      filterable: true,
      render: (m) => (
        <div>
          <div>{m.destinoNombre ?? "—"}</div>
          {m.destinoCvu && (
            <div className="text-xs text-muted-foreground font-mono">{m.destinoCvu}</div>
          )}
        </div>
      ),
    },
    {
      key: "monto",
      label: "Monto",
      sortable: true,
      render: (m) => <span className="font-mono tabular-nums">{formatARS(m.monto)}</span>,
    },
    {
      key: "fecha",
      label: "Fecha",
      filterable: "date",
      sortable: true,
      render: (m) => (
        <span className="font-mono tabular-nums text-xs">{formatFechaHora(m.fecha)}</span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      filterable: "enum",
      filterOptions: ["APROBADO", "EN PROGRESO", "PENDIENTE", "RECHAZADO"],
      render: (m) => estadoBadge(m.estado),
    },
  ];

  return (
    <>
      <PageHeader title={titulo} description={descripcion} />

      {query.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : query.isError ? (
        <Card>
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <AlertCircle size={22} className="text-destructive" />
            <p className="text-sm font-semibold">No se pudieron cargar los movimientos</p>
            <p className="text-sm text-muted-foreground">{mensajeError(query.error)}</p>
          </div>
        </Card>
      ) : movimientos.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin movimientos"
            description="No hay operaciones registradas para este filtro."
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={movimientos}
          keyExtractor={(m) => m.id}
          actions={(m) => (
            <ActionsDropdown
              actions={[{ label: "Ver detalles", icon: Eye, onClick: () => setDetail(m) }]}
            />
          )}
        />
      )}

      {detail && (
        <DetailModal
          title="Detalle de movimiento"
          onClose={() => setDetail(null)}
          rows={[
            {
              label: "Referencia",
              value: <span className="font-mono tabular-nums">{detail.referencia}</span>,
            },
            { label: "ID transacción", value: <span className="font-mono text-xs">{detail.id}</span> },
            { label: "Tipo", value: detail.tipo },
            { label: "Origen", value: detail.origenNombre ?? "—" },
            {
              label: "CVU origen",
              value: <span className="font-mono text-xs">{detail.origenCvu ?? "—"}</span>,
            },
            { label: "Destino", value: detail.destinoNombre ?? "—" },
            {
              label: "CVU destino",
              value: <span className="font-mono text-xs">{detail.destinoCvu ?? "—"}</span>,
            },
            {
              label: "CUIT destino",
              value: <span className="font-mono tabular-nums">{formatCuit(detail.destinoCuit)}</span>,
            },
            {
              label: "Monto",
              value: (
                <span className="font-mono font-semibold tabular-nums">
                  {formatARS(detail.monto)}
                </span>
              ),
            },
            {
              label: "Comisión",
              value: <span className="font-mono tabular-nums">{formatARS(detail.comision)}</span>,
            },
            {
              label: "Neto",
              value: <span className="font-mono tabular-nums">{formatARS(detail.neto)}</span>,
            },
            { label: "Concepto", value: detail.concepto || "—" },
            { label: "Método", value: detail.metodo || "—" },
            {
              label: "Fecha",
              value: <span className="font-mono">{formatFechaHora(detail.fecha)}</span>,
            },
            {
              label: "Acreditación",
              value: <span className="font-mono">{formatFechaHora(detail.fechaCompletado)}</span>,
            },
            { label: "Estado", value: estadoBadge(detail.estado) },
            // Solo se muestra si la operación falló: en el resto sobra.
            ...(detail.motivoFallo ? [{ label: "Motivo", value: detail.motivoFallo }] : []),
          ]}
        />
      )}
    </>
  );
}
