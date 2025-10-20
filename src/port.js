/* eslint no-control-regex: "off" */

import { uint8ArrayConcat, uint8ArraySplitBySeq } from "./uint8array.js";

const LINE_SPLIT = "\r\n";
const LINE_SPLIT_BYTES = new TextEncoder().encode(LINE_SPLIT);

/**
 * @typedef {Object} PortEventHandlers
 * @property {(port: SerialPort) => void} onConnect
 * @property {() => void} onDisconnect
 * @property {(error: Error) => void} onError
 * @property {(msg: string) => void} onMessage
 */

/**
 * Serial port wrapper
 */
class Port {
  /** @type {SerialPort | null} */
  #port = null;
  /** @type {ReadableStreamDefaultReader<Uint8Array<ArrayBuffer> | null} */
  #reader = null;
  /** @type {Boolean} */
  #keepReading = true;
  /** @type {Promise<void> | null} */
  #portClosePromise = null;

  /**
   *
   * @param {SerialOptions} portOptions
   * @param {Partial<PortEventHandlers>} [handlers]
   */
  constructor(portOptions, handlers = {}) {
    const { onConnect, onDisconnect, onError, onMessage } = handlers;
    const doNothing = () => {};
    this.portOptions = portOptions;
    this.onConnect = onConnect || doNothing;
    this.onDisconnect = onDisconnect || doNothing;
    this.onError = onError || doNothing;
    this.onMessage = onMessage || doNothing;
  }

  /**
   * Request port
   */
  async requestPort() {
    return navigator.serial.requestPort();
  }

  /**
   * Get previous connected port
   * @param {SerialPortInfo} prevInfo
   */
  async getPrevPort(prevInfo) {
    const ports = (await navigator.serial.getPorts()).filter((p) => {
      const info = p.getInfo();
      return Object.entries(prevInfo)
        .map(([k, v]) => info[k] == v)
        .every(Boolean);
    });
    if (ports.length) return ports[0];
    return false;
  }

  /**
   * Handle some VT100 escape code sequences
   * @param {string} s - Input message
   * @returns string
   */
  handleVT100Codes(s) {
    let result = s;

    for (const csi of ["\x1b[", "\x33["]) {
      // erase display
      for (const ed of ["J", "0J", "1J", "2J", "3J"]) {
        const code = csi + ed;
        result = result.split(code).at(-1);
      }

      // erase line
      result = result.split(csi + "K").at(0);
      result = result.split(csi + "0K").at(0);
      result = result.split(csi + "1K").at(-1);
      if (result.includes(csi + "2K")) {
        result = "";
      }
    }

    // escape code
    while (result.includes("\x08")) {
      result = result.replace(/^\x08/, "").replace(/[^\x08]\x08/, "");
    }

    return result;
  }

  /**
   * Read port until closed
   */
  async readUntilClosed() {
    if (!this.#port) return;
    this.#keepReading = true;
    let buffer = new Uint8Array(0);

    while (this.#port.readable && this.#keepReading) {
      this.#reader = this.#port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.#reader.read();
          if (done) break; // reader.cancel() has been called.
          if (value) {
            console.debug("[Port] Raw chunk received: ", value);
            buffer = uint8ArrayConcat(buffer, value);
          }
          const parts = uint8ArraySplitBySeq(buffer, LINE_SPLIT_BYTES);
          buffer = parts.pop();
          for (const msg of parts) {
            const text = new TextDecoder().decode(msg);
            this.onMessage(this.handleVT100Codes(text));
          }
        }
      } catch (error) {
        this.onError(error);
      } finally {
        // Allow the serial port to be closed later.
        this.#reader.releaseLock();
        this.#keepReading = false;
      }
    }

    await this.#port.close();
    this.onDisconnect();
  }

  /**
   * Stop reading
   */
  async stopReading() {
    this.#keepReading = false;
    // call reader.releaseLock() in the loop
    if (this.#port && this.#reader) this.#reader.cancel();
    if (this.#portClosePromise) await this.#portClosePromise;
  }

  /**
   * Forget all port
   */
  async forgetAll() {
    if (this.#port) await this.#port.forget();
    this.#port = null;
    for (const port of await navigator.serial.getPorts()) {
      await port.forget();
    }
  }

  /**
   * Connect to port
   * @param {SerialPort} port
   */
  async connectTo(port) {
    await this.stopReading();

    await port.open(this.portOptions);
    this.onConnect(port);
    this.#port = port;
    this.#portClosePromise = this.readUntilClosed();
    await this.#portClosePromise;
  }

  /**
   * Connect to previous connected port
   * @param {SerialPortInfo} prevInfo
   */
  async connectToPrev(prevInfo) {
    const port = await this.getPrevPort(prevInfo);
    if (port) {
      await this.connectTo(port);
      return true;
    }
    return false;
  }

  /**
   * Write message to port
   * @param {string | Uint8Array} msg - Message to send
   */
  async write(msg) {
    console.log(this.#port);
    if (!this.#port || !this.#port.writable) return false;
    const chunk = typeof msg === "string" ? new TextEncoder().encode(msg) : msg;
    const writer = this.#port.writable.getWriter();
    try {
      await writer.write(chunk);
    } catch (e) {
      this.onError(e);
    } finally {
      writer.releaseLock();
    }
  }
}

export { Port };
