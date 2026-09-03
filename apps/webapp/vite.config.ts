import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// El monorepo tiene React 18 (esta app) y React 19 (admin) a la vez. npm
// hoistea React 19 a la raíz junto a dependencias compartidas como
// @tanstack/react-query, y sin dedupe esa librería carga el React
// equivocado: los hooks quedan en null y el árbol no monta
// ("Cannot read properties of null (reading 'useEffect')").
//
// dedupe fuerza una sola copia; los alias garantizan que sea la local.
const local = (paquete: string) => path.resolve(__dirname, "node_modules", paquete);

export default defineConfig({
  server: {
    host: true,
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tecnomind/core": path.resolve(__dirname, "../../packages/core/src"),
      react: local("react"),
      "react-dom": local("react-dom"),
    },
  },
});
