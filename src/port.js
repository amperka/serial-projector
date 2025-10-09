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
   * @param {Partial<PortEventHandlers>} handlers
   */
  constructor(portOptions, { onConnect, onDisconnect, onError, onMessage }) {
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
   * Read port until closed
   */
  async readUntilClosed() {
    if (!this.#port) return;
    this.#keepReading = true;
    let buffer = "";

    while (this.#port.readable && this.#keepReading) {
      this.#reader = this.#port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.#reader.read();
          if (done) break; // reader.cancel() has been called.
          if (value) {
            buffer += new TextDecoder().decode(value);
          }
          const parts = buffer.split("\n");
          buffer = parts.pop();
          for (const msg of parts) {
            this.onMessage(msg);
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
   * Connect to port
   * @param {SerialPort} port
   */
  async connectTo(port) {
    this.#keepReading = false;
    // call reader.releaseLock() in the loop
    if (this.#port && this.#reader) this.#reader.cancel();
    if (this.#portClosePromise) await this.#portClosePromise;

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
    }
    return false;
  }

  /**
   * Write message to port
   * @param {string | Uint8Array} msg - Message to send
   */
  async write(msg) {
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
