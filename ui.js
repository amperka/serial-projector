import { Settings } from "./settings.js";

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
  constructor(
    msgEl,
    statusEl,
    settingsBtnEl,
    settingsCloseEl,
    settingsModalEl,
    styleBtnEl,
    styleCloseEl,
    styleModalEl,
    fullscreenBtnEl,
    connectBtnEl,
  ) {
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
  constructor(
    bgColor,
    textColor,
    fontFamily,
    fontSize,
    baudRate,
    dataBits,
    parity,
    stopBits,
  ) {
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
    this._msgEl.style.fontSize = fontSize + "vh";
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
      this.bgColor,
      this.textColor,
      this.fontFamily,
      this.fontSize,
      this.baudRate,
      this.dataBits,
      this.parity,
      this.stopBits,
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

export { AppUIRootElements, AppUISettingsElements, AppUISettings, AppUI };
