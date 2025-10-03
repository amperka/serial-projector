import { Settings } from "./settings.js";

const LOCAL_STORAGE_LAST_CONNECTED_PORT_KEY = "lastPort";

class App {
  /**
   * @param {import('./ui.js').AppUI} ui - UI instance
   */
  constructor(ui) {
    this._ui = ui;
    this._loadSettingsOnStart();

    this._ui.setConnectBtnOnClick(async () => {
      try {
        await this.requestPort(true);
      } catch {
        return;
      }
      this._ui.closeSettingsModal();
      await this.closePort();
      await this.openPort();
      await this.readLoop();
    });
  }

  _loadSettingsOnStart() {
    this._settings = Settings.loadFromLocalStorage(
      this._ui.settings.toSettings(),
    );
    this._ui.settings.fromSettings(this._settings);
  }

  /** @param {SerialPortInfo} info - Serial port info */
  async _saveLastConnectedPort(info) {
    localStorage.setItem(
      LOCAL_STORAGE_LAST_CONNECTED_PORT_KEY,
      JSON.stringify(info),
    );
  }

  /** @returns {Promise<SerialPortInfo>} */
  async _loadLastConnectedPort() {
    return JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_LAST_CONNECTED_PORT_KEY) || "{}",
    );
  }

  /** @param {boolean} [force] - Force port re-request */
  async requestPort(force) {
    if (this._port && !force) {
      return this._port;
    }
    try {
      this._port = await navigator.serial.requestPort();
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
        stopBits: this._settings.stopBits,
      });
      this._saveLastConnectedPort(this._port.getInfo());
      this._ui.showStatus("Connected");
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
      } catch {
        // continue regardless of error
      }
    }, 5000);
  }

  async closePort() {
    try {
      if (this._port) {
        if (this._reader) await this._reader.cancel();
        await this._port.close();
      }
    } catch {
      // continue regardless of error
    }
  }

  async readLoop() {
    const port = await this.requestPort();
    this._reader = port.readable.getReader();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await this._reader.read();
        if (done) break;
        if (value) {
          buffer += new TextDecoder().decode(value);
        }
        const parts = buffer.split("\n");
        buffer = parts.pop();
        for (const msg of parts) {
          this._ui.showMessage(msg);
        }
      }
    } catch (e) {
      this._ui.showStatus(`Read failed: ${e}`);
      console.error(e);
    } finally {
      this._reader.releaseLock();
      this._ui.showStatus("Disconnected (retrying...)");
      await this.reconnect();
    }
  }

  async start() {
    const prevPortInfo = await this._loadLastConnectedPort();
    const ports = (await navigator.serial.getPorts()).filter((p) => {
      const info = p.getInfo();
      return Object.entries(prevPortInfo)
        .map(([k, v]) => info[k] == v)
        .every(Boolean);
    });

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

export { App };
