import { StateContainer } from "./state.js";
import { loadState, saveState } from "./storage.js";
import { appHtmlElementNames, loadStateFromDOM, bindStateToDOM } from "./ui.js";
import { Port } from "./port.js";
import { mkDecoder } from "./encoding.js";
import { isEspruino } from "./board.js";

/**
 * @typedef {import('./ui.js').AppHTMLElements} AppHTMLElements
 */

/** @type {AppHTMLElements} */
const appHtmlElements = Object.fromEntries(
  appHtmlElementNames.map((k) => {
    if (k == "doc") return [k, document];
    return [k, document.getElementById(k)];
  }),
);

/**
 * Debounce decorator
 * @param {CallableFunction} func
 * @param {number} timeout
 */
export function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

/**
 * Make port event handlers
 * @param {Store} store
 * @returns {import("./port.js").PortEventHandlers}
 */
export const makePortHandlers = (store) => ({
  onConnect: (port) => {
    console.info("Port connected");
    store
      .setState({ lastPortInfo: null })
      .setState({ lastPortInfo: port.getInfo(), status: "Connected" });
  },
  onDisconnect: () => {
    console.info("Port disconnected");
    store.setState({ status: "Disconnected" });
  },
  onError: (error) => {
    console.error("Port error: ", error);
    store.setState({ status: `Error: ${error.message}` });
  },
  onMessage: (message) => {
    console.info(`Received message: ${message}`);
    store.setState({ message, status: "Receiving..." });
  },
});

/**
 * State to port options
 * @param {State} state
 * @returns {SerialOptions}
 */
export const getPortOptsFromState = (state) => ({
  baudRate: state.baudRate,
  dataBits: state.dataBits,
  parity: state.parity,
  stopBits: state.stopBits,
});

/**
 * State to port signal options
 * @param {State} state
 * @returns {Record<string, boolean>}
 */
export const getPortSignalOptsFromState = (state) => {
  const opts = {
    dataTerminalReady: state.dtrSignal,
    requestToSend: state.rtsSignal,
    break: state.breakSignal,
  };
  return Object.fromEntries(
    Object.entries(opts).filter(([_, v]) => typeof v === "boolean"),
  );
};

/**
 * Get StateContainer
 * @param {AppHTMLElements} el
 * @returns {StateContainer}
 */
export const getStore = (el) => new StateContainer(loadStateFromDOM(el));

/**
 * App entrypoint
 * @param {StateContainer} store
 * @param {typeof Port} SerialPort
 * @param {HTMLElement} connectBtn
 * @param {HTMLElement} disconnectBtn
 */
export async function init(
  store = getStore(appHtmlElements),
  SerialPort = Port,
  connectBtn = appHtmlElements.connectBtn,
  disconnectBtn = appHtmlElements.disconnectBtn,
) {
  // bind UI elements to store
  bindStateToDOM(appHtmlElements, store);

  // load saved state and enable autosave
  store.setState(loadState());
  store.subscribe(debounce(saveState, 1000));

  // check browser support
  if (!("serial" in navigator)) {
    store.setState({
      status: "💥 Web Serial API is not supported in your browser ☠️",
      message: "Not supported browser",
    });
    throw Error("Not supported browser");
  }

  const portHandlers = makePortHandlers(store);
  const runManualConnect = async () => {
    try {
      const requested = await port.requestPort();
      if (
        store.getState().encoding === "default" &&
        isEspruino(requested.getInfo())
      ) {
        store.setState({ encoding: "x-espruino-mixed-utf8" });
      }
      await port.connectTo(requested);
    } catch (e) {
      portHandlers.onError(e);
    }
  };

  const port = new SerialPort(
    getPortOptsFromState(store.getState()),
    mkDecoder(store.getState().encoding),
    makePortHandlers(store),
    getPortSignalOptsFromState(store.getState()),
  );
  console.debug(port); // can use port directly for debugging

  // connect on manual port select
  connectBtn.addEventListener("click", runManualConnect);

  // force disconnection
  disconnectBtn.addEventListener("click", async () => {
    await port.stopReading();
    await port.forgetAll();
    store.setState({ lastPortInfo: {} });
  });

  store.subscribe((state) => {
    // update decoder
    if (port.decoder.encoding !== state.encoding) {
      port.decoder = mkDecoder(state.encoding);
    }
    // update signal options
    port.setSignals(getPortSignalOptsFromState(state));
  });

  const connectToPrevPort = async () =>
    port.connectToPrev(store.getState().lastPortInfo);

  // try to connect to the last connected port on "connect" event
  // connect like connected + allowed by the user
  navigator.serial.addEventListener("connect", async () => connectToPrevPort());

  // connect to the last connected port
  await connectToPrevPort();
}
