const {
  app,
  BrowserWindow,
  globalShortcut,
  clipboard,
  ipcMain,
  Notification,
} = require("electron");
const axios = require("axios");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");

var config_valid = true;

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  autoUpdater.on("checking-for-update", () => {
    new Notification({
      title: "Update Check",
      body: "Checking for updates...",
    }).show();
  });

  autoUpdater.on("update-available", (info) => {
    new Notification({
      title: "Update Check",
      body: "Update available: " + info.version,
    }).show();
    app.setBadgeCount(1);
  });

  autoUpdater.on("update-not-available", () => {
    new Notification({
      title: "Update Check",
      body: "No Update available",
    }).show();
  });

  autoUpdater.on("download-progress", (data) => {
    win.setProgressBar(data.percent / 100.0);
  });

  autoUpdater.on("update-downloaded", (data) => {
    new Notification({
      title: "Update Check",
      body: "Installing Update",
    }).show();
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (error) => {
    new Notification({
      title: "Update Check",
      body: "ERR: " + error,
    }).show();
  });

  // ##### CONFIG CHECK #####

  const configExists = fs.existsSync(
    `C:\\users\\${require("os").userInfo().username}\\.ics-placetel-config.json`
  );

  // ##### END CONFIG CHECK #####

  if (!configExists) {
    win.loadFile("error.html");
    config_valid = false;
    return;
  }

  const config = require(`C:\\users\\${
    require("os").userInfo().username
  }\\.ics-placetel-config.json`);

  if (!config.shortcut_key) {
    win.loadFile("error.html");
    config_valid = false;
  }

  if (
    config.placetel_data.api_token === "" ||
    config.placetel_data.si_id === ""
  ) {
    win.loadFile("error.html");
    config_valid = false;
  }

  if (config_valid) win.loadFile("index.html");
  return { win, config };
}

app.whenReady().then(async () => {
  const window = await createWindow();
  app.setAppUserModelId("ICS Placetel Application");
  if (config_valid) {
    if (window.config.shortcut_key) {
      globalShortcut.register(window.config.shortcut_key, () => {
        window.win.webContents.send("dialkey");
      });
      autoUpdater.checkForUpdates();
    }
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
