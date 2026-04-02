import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // 允许外部访问
    port: 5173,
    proxy: {
      // 含 /api/docs、/api/v1/*；后端需运行在 5000 且已注册 docs 蓝图（改代码后请重启 Flask）
      "/api": {
        target: "http://47.76.211.100:5000", // 修改为实际后端服务器 IP
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
