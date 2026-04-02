import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 加载环境变量（如果有的话）
  const env = loadEnv(mode, process.cwd(), "");
  // 优先使用环境变量，否则默认本地开发地址
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:5000";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: ["ira.vin", "localhost", "127.0.0.1"],
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
