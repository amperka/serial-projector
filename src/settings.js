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
  const load = (key) =>
    localStorage.getItem(SETTINGS_LOCAL_STORAGE_KEY_PREFIX + key);
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

export { Settings };
