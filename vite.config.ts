import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Kiki-dog/" : "/",
  // Mirrored workspaces do not reliably emit filesystem change notifications.
  server: { watch: { usePolling: true, interval: 500 } },
}));
