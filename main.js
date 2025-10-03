import { AppUIRootElements, AppUISettingsElements, AppUI } from "./ui.js";
import { App } from "./app.js";

async function init() {
  const uiRootElements = new AppUIRootElements(
    document.getElementById("message"),
    document.getElementById("status"),
    document.getElementById("settingsBtn"),
    document.getElementById("closeSettings"),
    document.getElementById("settingsModal"),
    document.getElementById("styleBtn"),
    document.getElementById("closeStyle"),
    document.getElementById("styleModal"),
    document.getElementById("fullscreenBtn"),
    document.getElementById("connectBtn"),
  );
  const uiSettingsElements = new AppUISettingsElements(
    document.getElementById("bgColor"),
    document.getElementById("textColor"),
    document.getElementById("fontFamily"),
    document.getElementById("fontSize"),
    document.getElementById("baudRate"),
    document.getElementById("dataBits"),
    document.getElementById("parity"),
    document.getElementById("stopBits"),
  );
  const ui = new AppUI(uiRootElements, uiSettingsElements);

  ui.showMessage("Test");

  // dead end
  if (!("serial" in navigator)) {
    ui.showStatus("💥 Web Serial API is not supported in your browser ☠️");
    ui.showMessage("Not supported browser");
    return;
  }

  const app = new App(ui);
  await app.start();
}

export { init };
