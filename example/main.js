"use strict";

/* eslint-disable no-console */

const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const DiscordRPC = require("../");
const { getLogicProInfo } = require("./logicpro");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 380,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open DevTools for debugging
  // mainWindow.webContents.openDevTools({ mode: "detach" });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Set this to your Client ID.
const clientId = "1350914307667529820";

console.log("Initializing Discord RPC...");

// Only needed if you want to use spectate, join, or ask to join
try {
  console.log("Registering client ID:", clientId);
  DiscordRPC.register(clientId);
} catch (error) {
  console.error("Failed to register client ID:", error);
}

const rpc = new DiscordRPC.Client({ transport: "ipc" });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc || !mainWindow) {
    console.log("RPC or window not ready");
    return;
  }

  try {
    console.log("Getting Logic Pro info...");
    const logicInfo = await getLogicProInfo();
    console.log("Logic Pro info:", logicInfo);

    // Only update Discord if Logic Pro is actually running
    if (logicInfo.status !== "Not Running" && logicInfo.status !== "Error") {
      console.log("Setting activity...");
      await rpc.setActivity({
        details: logicInfo.projectName,
        state: logicInfo.status,
        startTimestamp,
        largeImageKey: "logic",
        largeImageText: "Logic Pro",
        smallImageKey:
          logicInfo.status.toLowerCase() === "playing" ? "playing" : "editing",
        smallImageText: logicInfo.status,
        instance: false,
      });
      console.log("Activity set successfully");
    } else {
      console.log(
        "Logic Pro is not running or encountered an error, clearing activity"
      );
      await rpc.clearActivity();
    }

    // Update UI with Logic Pro status
    if (mainWindow) {
      mainWindow.webContents.send("logic-status", logicInfo);
    }
  } catch (error) {
    console.error("Failed to set activity:", error);
    if (mainWindow) {
      mainWindow.webContents.send("logic-status", {
        projectName: "Error",
        status: "Check console",
      });
    }
  }
}

rpc.on("ready", () => {
  console.log("Discord RPC Ready!");
  setActivity();
  if (mainWindow) {
    mainWindow.webContents.send("discord-ready");
  }

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.on("disconnected", () => {
  console.log("Discord RPC Disconnected");
  if (mainWindow) {
    mainWindow.webContents.send("discord-disconnected");
  }
});

rpc.on("error", (error) => {
  console.error("Discord RPC Error:", error);
});

console.log("Attempting to login with client ID:", clientId);
rpc.login({ clientId }).catch((error) => {
  console.error("Failed to login:", error);
});
