import { AppUI } from "./ui.js";
import { App } from "./app.js";

/** @type {import('./ui.js').AppUIRootElements} */
const uiRootElements = {
  msg: document.getElementById("message"),
  status: document.getElementById("status"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsClose: document.getElementById("closeSettings"),
  settingsModal: document.getElementById("settingsModal"),
  styleBtn: document.getElementById("styleBtn"),
  styleClose: document.getElementById("closeStyle"),
  styleModal: document.getElementById("styleModal"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  connectBtn: document.getElementById("connectBtn"),
};

/** @type {import('./ui.js').AppUISettingsElements} */
const uiSettingsElements = {
  bgColor: document.getElementById("bgColor"),
  textColor: document.getElementById("textColor"),
  fontFamily: document.getElementById("fontFamily"),
  fontSize: document.getElementById("fontSize"),
  baudRate: document.getElementById("baudRate"),
  dataBits: document.getElementById("dataBits"),
  parity: document.getElementById("parity"),
  stopBits: document.getElementById("stopBits"),
};

async function init() {
  const ui = new AppUI(uiRootElements, uiSettingsElements);

  if ("serial" in navigator) {
    const app = new App(ui);
    await app.start();
  } else {
    ui.showStatus("💥 Web Serial API is not supported in your browser ☠️");
    ui.showMessage("Not supported browser");
  }
}

init();
