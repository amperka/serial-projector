const SETTINGS_LOCAL_STORAGE_KEY_PREFIX = "settings_";

/**
 * Settings value object
 */
class Settings {
  /**
    * @param {string} bgColor - Background color
    * @param {string} textColor - Text color
    * @param {string} fontFamily - Font family
    * @param {string} fontSize - Font size
    * @param {number} baudRate - Baud rate
    * @param {number} dataBits - Data bits
    * @param {string} parity - Parity
    * @param {number} stopBits - Stop bits
  */
  constructor(bgColor, textColor, fontFamily, fontSize, baudRate, dataBits, parity, stopBits) {
    this._bgColor = bgColor;
    this._textColor = textColor;
    this._fontFamily = fontFamily;
    this._fontSize = fontSize;
    this._baudRate = baudRate;
    this._dataBits = dataBits;
    this._parity = parity;
    this._stopBits = stopBits;
  }

  _savePropertyToLocalStorage(key, value) {
    localStorage.setItem(SETTINGS_LOCAL_STORAGE_KEY_PREFIX + key, value);
  }

  get bgColor() {
    return this._bgColor;
  }

  set bgColor(color) {
    this._bgColor = color;
    this._savePropertyToLocalStorage("bgColor", this._bgColor);
  }

  get textColor() {
    return this._textColor;
  }

  set textColor(color) {
    this._textColor = color;
    this._savePropertyToLocalStorage("textColor", this._textColor);
  }

  get fontFamily() {
    return this._fontFamily;
  }

  set fontFamily(fontFamily) {
    this._fontFamily = fontFamily;
    this._savePropertyToLocalStorage("fontFamily", this._fontFamily);
  }

  get fontSize() {
    return this._fontSize;
  }

  set fontSize(fontSize) {
    this._fontSize = fontSize;
    this._savePropertyToLocalStorage("fontSize", this._fontSize);
  }

  get baudRate() {
    return this._baudRate;
  }

  set baudRate(baudRate) {
    this._baudRate = baudRate;
    this._savePropertyToLocalStorage("baudRate", this._baudRate);
  }

  get dataBits() {
    return this._dataBits;
  }

  set dataBits(dataBits) {
    this._dataBits = dataBits;
    this._savePropertyToLocalStorage("dataBits", this._dataBits);
  }

  get parity() {
    return this._parity;
  }

  set parity(parity) {
    this._parity = parity;
    this._savePropertyToLocalStorage("parity", this._parity);
  }

  get stopBits() {
    return this._stopBits;
  }

  set stopBits(stopBits) {
    this._stopBits = stopBits;
    this._savePropertyToLocalStorage("stopBits", this._stopBits);
  }
}


/** @param {Settings} defaultSettings - Default settings */
Settings.loadFromLocalStorage = function (defaultSettings) {
  const load = (key) => localStorage.getItem(SETTINGS_LOCAL_STORAGE_KEY_PREFIX + key);
  return new Settings(
    load("bgColor") || defaultSettings.bgColor,
    load("textColor") || defaultSettings.textColor,
    load("fontFamily") || defaultSettings.fontFamily,
    load("fontSize") || defaultSettings.fontSize,
    load("baudRate") || defaultSettings.baudRate,
    load("dataBits") || defaultSettings.dataBits,
    load("parity") || defaultSettings.parity,
    load("stopBits") || defaultSettings.stopBits,
  );
};

class AppUIRootElements {
  /**
   * @param {HTMLElement} msgEl - Message HTML element
   * @param {HTMLElement} statusEl - Status HTML element
   * @param {HTMLElement} settingsBtnEl - Settings button HTML element
   * @param {HTMLElement} settingsCloseEl - Close settings HTML element
   * @param {HTMLElement} settingsModalEl - Settings modal HTML element
   * @param {HTMLElement} styleBtnEl - Style button HTML element
   * @param {HTMLElement} styleCloseEl - Close style HTML element
   * @param {HTMLElement} styleModalEl - Style modal HTML element
   * @param {HTMLElement} fullscreenBtnEl - Full screen button HTML element
   * @param {HTMLElement} connectBtnEl - Connect button HTML element
   */
  constructor(msgEl, statusEl, settingsBtnEl, settingsCloseEl, settingsModalEl, styleBtnEl, styleCloseEl, styleModalEl, fullscreenBtnEl, connectBtnEl) {
    this.msg = msgEl;
    this.status = statusEl;
    this.settingsBtn = settingsBtnEl;
    this.settingsClose = settingsCloseEl;
    this.settingsModal = settingsModalEl;
    this.styleBtn = styleBtnEl;
    this.styleClose = styleCloseEl;
    this.styleModal = styleModalEl;
    this.fullscreenBtn = fullscreenBtnEl;
    this.connectBtn = connectBtnEl;
  }
}

class AppUISettingsElements {
  /**
   * @param {HTMLElement} bgColor - Background color HTML element
   * @param {HTMLElement} textColor - Text color HTML element
   * @param {HTMLElement} fontFamily - Font family HTML element
   * @param {HTMLElement} fontSize - Font size HTML element
   * @param {HTMLElement} baudRate - Baud rate HTML element
   * @param {HTMLElement} dataBits - Data bits HTML element
   * @param {HTMLElement} parity - Parity HTML element
   * @param {HTMLElement} stopBits - Stop bits HTML element
   */
  constructor(bgColor, textColor, fontFamily, fontSize, baudRate, dataBits, parity, stopBits) {
    this.bgColor = bgColor;
    this.textColor = textColor;
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.baudRate = baudRate;
    this.dataBits = dataBits;
    this.parity = parity;
    this.stopBits = stopBits;
  }
}

class AppUISettings {
  /**
   * @param {HTMLElement} msgEl - Message HTML element
   * @param {AppUISettingsElements} el - HTML elements
   */
  constructor(msgEl, el) {
    this._msgEl = msgEl;
    this._el = el;
    el.bgColor.oninput = (e) => {
      this.bgColor = e.target.value;
    };
    el.textColor.oninput = (e) => {
      this.textColor = e.target.value;
    };
    el.fontFamily.onchange = (e) => {
      this.fontFamily = e.target.value;
    };
    el.fontSize.onchange = (e) => {
      this.fontSize = e.target.value;
    };
    el.baudRate.onchange = (e) => {
      this.baudRate = e.target.value;
    };
    el.dataBits.onchange = (e) => {
      this.dataBits = e.target.value;
    };
    el.parity.onchange = (e) => {
      this.parity = e.target.value;
    };
    el.stopBits.onchange = (e) => {
      this.stopBits = e.target.value;
    };
  }

  get bgColor() {
    return this._el.bgColor.value;
  }

  /** @param {string} color - Background color */
  set bgColor(color) {
    this._el.bgColor.value = color;
    document.body.style.background = color;
    this.toSettings().bgColor = color;
  }

  get textColor() {
    return this._el.textColor.value;
  }

  /** @param {string} color - Text color */
  set textColor(color) {
    this._el.textColor.value = color;
    this._msgEl.style.color = color;
    this.toSettings().textColor = color;
  }

  get fontFamily() {
    return this._el.fontFamily.value;
  }

  /** @param {string} fontFamily - Font family */
  set fontFamily(fontFamily) {
    this._el.fontFamily.value = fontFamily;
    this._msgEl.style.fontFamily = fontFamily;
    this.toSettings().fontFamily = fontFamily;
  }

  get fontSize() {
    return this._el.fontSize.value;
  }

  /** @param {string} fontSize - Font size */
  set fontSize(fontSize) {
    this._el.fontSize.value = fontSize;
    this._msgEl.style.fontSize = fontSize + 'vh';
    this.toSettings().fontSize = fontSize;
  }

  get baudRate() {
    return +this._el.baudRate.value;
  }

  /** @param {number} baudRate - Baud rate */
  set baudRate(baudRate) {
    this._el.baudRate.value = baudRate;
    this._msgEl.style.baudRate = baudRate;
    this.toSettings().baudRate = baudRate;
  }

  get dataBits() {
    return +this._el.dataBits.value;
  }

  /** @param {number} dataBits - Baud rate */
  set dataBits(dataBits) {
    this._el.dataBits.value = dataBits;
    this.toSettings().dataBits = dataBits;
  }

  get parity() {
    return this._el.parity.value;
  }

  /** @param {string} parity - Parity bits */
  set parity(parity) {
    this._el.parity.value = parity;
    this.toSettings().parity = parity;
  }

  get stopBits() {
    return +this._el.stopBits.value;
  }

  /** @param {number} stopBits - Stop bits */
  set stopBits(stopBits) {
    this._el.stopBits.value = stopBits;
    this.toSettings().stopBits = stopBits;
  }

  toSettings() {
    return new Settings(
      this.bgColor, this.textColor, this.fontFamily, this.fontSize, this.baudRate, this.dataBits, this.parity, this.stopBits
    );
  }

  /** @param {Settings} settings - Settings */
  fromSettings(settings) {
    this.bgColor = settings.bgColor;
    this.textColor = settings.textColor;
    this.fontFamily = settings.fontFamily;
    this.fontSize = settings.fontSize;
    this.baudRate = settings.baudRate;
    this.dataBits = settings.dataBits;
    this.parity = settings.parity;
    this.stopBits = settings.stopBits;
  }
}


class AppUI {
  /**
   * @param {AppUIRootElements} rootEl - HTML elements
   * @param {AppUISettingsElements} settingsEl - HTML elements
   */
  constructor(rootEl, settingsEl, settingsSetCallback) {
    this._rootEl = rootEl;
    this._rootEl.settingsBtn.onclick = this.openSettingsModal.bind(this);
    this._rootEl.settingsClose.onclick = this.closeSettingsModal.bind(this);
    this._rootEl.styleBtn.onclick = this.openStyleModal.bind(this);
    this._rootEl.styleClose.onclick = this.closeStyleModal.bind(this);
    this._rootEl.fullscreenBtn.onclick = this.toggleFullscreen.bind(this);

    this.settings = new AppUISettings(rootEl.msg, settingsEl);
  }

  /** @param {HTMLElement} el - Target modal element. */
  _openModal(el) {
    el.style.display = "flex";
  }

  /** @param {HTMLElement} el - Target modal element. */
  _closeModal(el) {
    el.style.display = "none";
  }

  openSettingsModal() {
    this._openModal(this._rootEl.settingsModal);
  }

  closeSettingsModal() {
    this._closeModal(this._rootEl.settingsModal);
  }

  openStyleModal() {
    this._openModal(this._rootEl.styleModal);
  }

  closeStyleModal() {
    this._closeModal(this._rootEl.styleModal);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  setConnectBtnOnClick(fn) {
    this._rootEl.connectBtn.onclick = fn;
  }

  /** @param {string} text - Status text */
  showStatus(text) {
    this._rootEl.status.innerText = text;
  }

  /** @param {string} html - Meassage */
  showMessage(html) {
    // minimal sanitization: strip <script> and inline on*
    const safe = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/ on\w+="[^"]*"/g, "");
    this._rootEl.msg.innerHTML = safe;
  }
}


class App {
  /**
   * @param {AppUI} ui - UI instance
   */
  constructor(ui) {
    this._ui = ui;
    this._loadSettingsOnStart();

    this._ui.setConnectBtnOnClick(async () => {
      await this.closePort();
      try { await this.requestPort(true); } catch { return; }
      this._ui.closeSettingsModal();
      await this.openPort();
      await this.readLoop();
    });
  }

  _loadSettingsOnStart() {
    this._settings = Settings.loadFromLocalStorage(this._ui.settings.toSettings());
    this._ui.settings.fromSettings(this._settings);
  }

  /** @param {boolean} [force] - Force port re-request */
  async requestPort(force) {
    if (this._port && !force) {
      return this._port;
    }
    try {
      this._port = await navigator.serial.requestPort();
      const ports = await navigator.serial.getPorts();
    } catch (e) {
      this._ui.showStatus(`Port request canceled: ${e}`);
      throw Error("Port request canceled", e);
    }
    return this._port;
  }

  async openPort() {
    let port;
    try {
      port = await this.requestPort();
    } catch {
      return;
    }
    try {
      await port.open({
        baudRate: this._settings.baudRate,
        dataBits: this._settings.dataBits,
        parity: this._settings.parity,
        stopBits: this._settings.stopBits
      });
    } catch (e) {
      this._ui.showStatus(`Port open failed: ${e}`);
      throw Error("Port open failed", e);
    }
  }

  async reconnect() {
    if (this._reconnectInterval) clearInterval(this._reconnectInterval);
    this._reconnectInterval = setInterval(async () => {
      try {
        await this.openPort();
        clearInterval(this._reconnectInterval);
        await this.readLoop();
      } catch { }
    }, 5000);
  }

  async closePort() {
    try {
      if (this._port) {
        await this._port.close();
      }
    } catch { }
  }

  async readLoop() {
    this._ui.showStatus("Connected");
    const reader = this._port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        this._ui.showMessage(value);
      }
    } catch (e) {
      this._ui.showStatus(`Read failed: ${e}`);
    } finally {
      await this.closePort();
    }
  }

  async start() {
    const ports = await navigator.serial.getPorts();
    if (ports.length) {
      this._port = ports[0];
      try {
        await this.openPort();
        await this.readLoop();
      } catch (e) {
        this._ui.showStatus(`Connect failed: ${e}`);
        await this.closePort();
      }
    }
  }
}


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





// // async function readLoop() {
// //   statusEl.innerText = "Connected";
// //   msgEl.style.opacity = 1;
// //   reader = port.readable.getReader();
// //   let buffer = "";
// //   try {
// //     while (true) {
// //       const { value, done } = await reader.read();
// //       if (done) break;
// //       buffer += new TextDecoder().decode(value);
// //       let parts = buffer.split("\n");
// //       buffer = parts.pop();
// //       for (const msg of parts) {
// //         showMessage(msg);
// //       }
// //     }
// //   } catch (e) {
// //     console.error(e);
// //   } finally {
// //     reader.releaseLock();
// //     statusEl.innerText = "Disconnected (retrying...)";
// //     msgEl.style.opacity = 0.5;
// //     reconnect();
// //   }
// // }


init();
