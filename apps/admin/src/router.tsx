import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Sin defaults, React Query trae staleTime 0 + refetchOnWindowFocus, así que
  // cada navegación (o al volver el foco a la pestaña) re-consultaba todo y
  // aparecía el "Cargando…", dando la sensación de que la página se recarga.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 min: volver a una pantalla usa la caché, no refetch
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false, // volver a la pestaña no recarga todo
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 5 * 60 * 1000,
    defaultPendingMs: 0,
    defaultPendingMinMs: 200,
  });

  return router;
};
