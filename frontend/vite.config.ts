import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 含 /api/docs、/api/v1/*；后端需运行在 5000 且已注册 docs 蓝图（改代码后请重启 Flask）
      "/api": { target: "http://127.0.0.1:5000", changeOrigin: true, ws: true },
    },
  },
});
