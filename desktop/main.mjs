import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopDirectory = path.dirname(fileURLToPath(import.meta.url));

function createGameWindow() {
  const gameWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#48678f",
    icon: path.join(desktopDirectory, "../build-resources/icon.png"),
    title: "圈一圈",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  gameWindow.removeMenu();
  gameWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  gameWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== gameWindow.webContents.getURL()) event.preventDefault();
  });
  gameWindow.webContents.on("before-input-event", (event, input) => {
    const toggleFullscreen =
      input.type === "keyDown" &&
      (input.key === "F11" || (input.alt && input.key === "Enter"));
    if (!toggleFullscreen) return;

    event.preventDefault();
    gameWindow.setFullScreen(!gameWindow.isFullScreen());
  });

  void gameWindow.loadFile(
    path.join(desktopDirectory, "../dist-offline/index.html"),
  );
}

app.setAppUserModelId("com.civineko.quanyiquan");
app.whenReady().then(createGameWindow);
app.on("window-all-closed", () => app.quit());
