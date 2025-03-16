"use strict";

/* eslint-env browser */

const { ipcRenderer } = require("electron");

console.log("Renderer process started");

const statusElement = document.getElementById("connection-status");
const logicStatusElement = document.getElementById("logic-status");

if (!statusElement) {
  console.error("Could not find status element!");
}

if (!logicStatusElement) {
  console.error("Could not find logic status element!");
}

// Set initial status
statusElement.textContent = "Connecting...";
statusElement.style.color = "#faa61a";

// Update status when Discord RPC connects
ipcRenderer.on("discord-ready", () => {
  console.log("Received discord-ready event");
  if (statusElement) {
    statusElement.textContent = "Connected";
    statusElement.style.color = "#43b581";
  }
});

// Update status when Discord RPC disconnects
ipcRenderer.on("discord-disconnected", () => {
  console.log("Received discord-disconnected event");
  if (statusElement) {
    statusElement.textContent = "Disconnected";
    statusElement.style.color = "#f04747";
  }
});

// Update Logic Pro status
ipcRenderer.on("logic-status", (event, logicInfo) => {
  console.log("Received logic-status event:", logicInfo);
  if (logicStatusElement) {
    logicStatusElement.textContent = `${logicInfo.projectName} (${logicInfo.status})`;
    logicStatusElement.style.color =
      logicInfo.status === "Not Running" ? "#f04747" : "#43b581";
  }
});

// Log any IPC errors
ipcRenderer.on("error", (event, error) => {
  console.error("IPC Error:", error);
  if (statusElement) {
    statusElement.textContent = "Error";
    statusElement.style.color = "#f04747";
  }
});
