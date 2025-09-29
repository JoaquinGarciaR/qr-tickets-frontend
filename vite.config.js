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
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8000", // tu FastAPI local
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/api/, ""),
    //   },
    // },
    allowedHosts : ["https://qr-tickets-frontend.vercel.app","https://qr-tickets-frontend-staging.vercel.app","9e895c1558ed.ngrok-free.app"],
    host: true, // acceder desde el móvil en la LAN
  },
});
