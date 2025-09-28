// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
export default defineConfig({
  plugins: [react()],
  server: {
    // https: {
    //   key: fs.readFileSync("./localhost-key.pem"),
    //   cert: fs.readFileSync("./localhost.pem"),
    // },
    allowedHosts : ["00bf33b05c46.ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://localhost:8000", // tu FastAPI local
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    host: true, // acceder desde el móvil en la LAN
  },
});
