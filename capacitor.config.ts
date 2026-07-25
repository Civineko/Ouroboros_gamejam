import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.civineko.ouroboros",
  appName: "圈一圈",
  webDir: "dist",
  backgroundColor: "#466b8d",
  zoomEnabled: false,
  loggingBehavior: "none",
  android: {
    backgroundColor: "#466b8d",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
