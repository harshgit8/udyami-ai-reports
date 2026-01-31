import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

const databaseDir = path.resolve(__dirname, "database");
const distDatabaseDir = path.resolve(__dirname, "dist", "database");

function serveDatabasePlugin() {
  return {
    name: "serve-database",
    configureServer(server: { middlewares: { use: (p: string, h: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use("/database", (req, res, next) => {
        if (!req.url) return next();
        const decoded = decodeURIComponent(req.url);
        const relative = decoded.replace(/^\/database\/?/i, "").replace(/^\//, "").replace(/\.\./g, "").trim();
        if (!relative) return next();
        const filePath = path.join(databaseDir, relative);
        if (!filePath.startsWith(databaseDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (fs.existsSync(databaseDir)) {
        if (!fs.existsSync(path.resolve(__dirname, "dist"))) return;
        fs.mkdirSync(distDatabaseDir, { recursive: true });
        for (const name of fs.readdirSync(databaseDir)) {
          const src = path.join(databaseDir, name);
          const dest = path.join(distDatabaseDir, name);
          if (fs.statSync(src).isFile()) fs.copyFileSync(src, dest);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), serveDatabasePlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
