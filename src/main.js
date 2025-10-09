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
  connectBtn: document.getElementById("connectBtn"),
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
function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

/**
 * Create handler of connect event
 * @param {Store} store
 * @returns {(port: SerialPort) => any}
 */
const makeOnConnectHandler = (store) => (port) => {
  console.info("Port connected");
  store
    .setState({ lastPostInfo: null })
    .setState({ lastPortInfo: port.getInfo(), status: "Connected" });
};

/**
 * Create handler of disconnect event
 * @param {Store} store
 * @returns {() => any}
 */
const makeOnDisconnectHandler = (store) => () => {
  console.info("Port disconnected");
  store.setState({ status: "Disconnected" });
};

/**
 * Create handler of error event
 * @param {Store} store
 * @returns {(error: Error) => any}
 */
const makeOnErrorHandler = (store) => (error) => {
  console.error("Port error: ", error);
  store.setState({ status: `Error: ${error.message}` });
};

/**
 * Create handler of message event
 * @param {Store} store
 * @returns {(message: string) => any}
 */
const makeOnMessageHandler = (store) => (message) => {
  console.info(`Received message: ${message}`);
  store.setState({ message, status: "Receiving..." });
};

/**
 * State to port options
 * @param {State} state
 * @returns {SerialOptions}
 */
const getPortOptsFromState = (state) => ({
  baudRate: state.baudRate,
  dataBits: state.dataBits,
  parity: state.parity,
  stopBits: state.stopBits,
});

async function init() {
  // init store with defauls from DOM
  const initialState = loadStateFromDOM(appHtmlElements);
  const store = new StateContainer(initialState);

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

  const onError = makeOnErrorHandler(store);
  const runManualConnect = async () => {
    try {
      await port.connectTo(await port.requestPort());
    } catch (e) {
      onError(e);
    }
  };

  const port = new Port(
    getPortOptsFromState(store.getState()),
    makeOnConnectHandler(store),
    makeOnDisconnectHandler(store),
    onError,
    makeOnMessageHandler(store),
  );

  // connect on manual port select
  appHtmlElements.connectBtn.addEventListener("click", runManualConnect);

  const connectToPrevPort = async () =>
    port.connectToPrev(store.getState().lastPortInfo);

  // try to connect to the last connected port on "connect" event
  // connect like connected + allowed by the user
  navigator.serial.addEventListener("connect", async () => connectToPrevPort());

  // connect to the last connected port
  await connectToPrevPort();
}

init();
