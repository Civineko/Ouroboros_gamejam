const path = require("node:path");
const { app, BrowserWindow, Menu, session } = require("electron");

const APP_BACKGROUND = "#466b8d";

function isBlockedBrowserShortcut(input) {
  if (input.key === "F5") return true;
  if (!input.control && !input.meta) return false;
  return ["+", "=", "-", "0", "r"].includes(input.key.toLowerCase());
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    useContentSize: true,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: APP_BACKGROUND,
    title: "Ouroboros",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
      backgroundThrottling: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });
  window.webContents.on("before-input-event", (event, input) => {
    if (isBlockedBrowserShortcut(input)) event.preventDefault();
  });
  window.webContents.on("context-menu", (event) => event.preventDefault());
  window.webContents.setVisualZoomLevelLimits(1, 1);
  window.once("ready-to-show", () => window.show());
  window.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
