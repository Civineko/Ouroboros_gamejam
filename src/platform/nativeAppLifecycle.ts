import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";

interface NativeAppLifecycleHandlers {
  onPause: () => void;
  onBack: () => boolean;
}

export function bindNativeAppLifecycle(
  handlers: NativeAppLifecycleHandlers,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let disposed = false;
  const listeners: PluginListenerHandle[] = [];

  void Promise.all([
    App.addListener("pause", handlers.onPause),
    App.addListener("backButton", () => {
      if (!handlers.onBack()) void App.exitApp();
    }),
  ]).then((nextListeners) => {
    if (disposed) {
      for (const listener of nextListeners) void listener.remove();
      return;
    }
    listeners.push(...nextListeners);
  });

  return () => {
    disposed = true;
    for (const listener of listeners) void listener.remove();
    listeners.length = 0;
  };
}
