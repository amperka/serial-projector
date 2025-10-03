import { Settings } from "./settings.js";

class App {
  /**
   * @param {import('./ui.js').AppUI} ui - UI instance
   */
  constructor(ui) {
    this._ui = ui;
    this._loadSettingsOnStart();

    this._ui.setConnectBtnOnClick(async () => {
      await this.closePort();
      try {
        await this.requestPort(true);
      } catch {
        return;
      }
      this._ui.closeSettingsModal();
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
        await this._port.close();
      }
    } catch {
      // continue regardless of error
    }
  }

  async readLoop() {
    this._ui.showStatus("Connected");
    const reader = this._port.readable.getReader();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += new TextDecoder().decode(value);
        const parts = buffer.split("\n");
        buffer = parts.pop();
        for (const msg of parts) {
          this._ui.showMessage(msg);
        }
        if (done) break;
      }
    } catch (e) {
      this._ui.showStatus(`Read failed: ${e}`);
      console.error(e);
    } finally {
      reader.releaseLock();
      this._ui.showStatus("Disconnected (retrying...)");
      await this.reconnect();
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

export { App };
