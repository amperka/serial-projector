import { StateContainer } from "./state.js";
import { loadState, saveState } from "./storage.js";
import { loadStateFromDOM, bindStateToDOM } from "./ui.js";
import { Port } from "./port.js";

/**
 * @typedef {import('./ui.js').AppHTMLElements} AppHTMLElements
 */

/** @type {AppHTMLElements} */
const appHtmlElements = {
  doc: document,
  msg: document.getElementById("message"),
  status: document.getElementById("status"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsClose: document.getElementById("closeSettings"),
  settingsModal: document.getElementById("settingsModal"),
  styleBtn: document.getElementById("styleBtn"),
  styleClose: document.getElementById("closeStyle"),
  styleModal: document.getElementById("styleModal"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  aboutBtn: document.getElementById("aboutBtn"),
  aboutModal: document.getElementById("aboutModal"),
  aboutClose: document.getElementById("closeAbout"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  bgColor: document.getElementById("bgColor"),
  textColor: document.getElementById("textColor"),
  fontFamily: document.getElementById("fontFamily"),
  fontSize: document.getElementById("fontSize"),
  baudRate: document.getElementById("baudRate"),
  dataBits: document.getElementById("dataBits"),
  parity: document.getElementById("parity"),
  stopBits: document.getElementById("stopBits"),
};

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
      await port.connectTo(await port.requestPort());
    } catch (e) {
      portHandlers.onError(e);
    }
  };

  const port = new SerialPort(
    getPortOptsFromState(store.getState()),
    makePortHandlers(store),
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

  const connectToPrevPort = async () =>
    port.connectToPrev(store.getState().lastPortInfo);

  // try to connect to the last connected port on "connect" event
  // connect like connected + allowed by the user
  navigator.serial.addEventListener("connect", async () => connectToPrevPort());

  // connect to the last connected port
  await connectToPrevPort();
}
