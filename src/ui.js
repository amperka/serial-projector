/**
 * @typedef {Object} AppHTMLElements
 * @property {Document} doc - Root document
 * @property {HTMLElement} msg - Message HTML element
 * @property {HTMLElement} status - Status HTML element
 * @property {HTMLElement} settingsBtn - Settings button HTML element
 * @property {HTMLElement} settingsClose - Close settings HTML element
 * @property {HTMLElement} settingsModal - Settings modal HTML element
 * @property {HTMLElement} styleBtn - Style button HTML element
 * @property {HTMLElement} styleClose - Close style HTML element
 * @property {HTMLElement} styleModal - Style modal HTML element
 * @property {HTMLElement} fullscreenBtn - Full screen button HTML element
 * @property {HTMLElement} aboutBtn - About button HTML element
 * @property {HTMLElement} aboutModal - About modal HTML element
 * @property {HTMLElement} aboutClose - Close about modal HTML element
 * @property {HTMLElement} connectBtn - Connect button HTML element
 * @property {HTMLElement} disconnectBtn - Disconnect button HTML element
 * @property {HTMLElement} bgColor - Background color HTML element
 * @property {HTMLElement} textColor - Text color HTML element
 * @property {HTMLElement} fontFamily - Font family HTML element
 * @property {HTMLElement} fontSize - Font size HTML element
 * @property {HTMLElement} baudRate - Baud rate HTML element
 * @property {HTMLElement} dataBits - Data bits HTML element
 * @property {HTMLElement} parity - Parity HTML element
 * @property {HTMLElement} stopBits - Stop bits HTML element
 */

/**
 * @typedef {import('./state.js').State} State
 * @typedef {import('./state.js').StateContainer} StateContainer
 */

/**
 * Checks if modal window is closed
 * @param {HTMLElement} el
 */
export const isModalClosed = (el) => ["", "none"].includes(el.style.display);

/**
 * Open modal
 * @param {HTMLElement} el
 */
export const openModal = (el) => {
  el.style.display = "flex";
};

/**
 * Close modal
 * @param {HTMLElement} el
 */
export const closeModal = (el) => {
  el.style.display = "none";
};

/**
 * Load state from DOM
 * @param {AppHTMLElements} el
 * @returns {State}
 */
export const loadStateFromDOM = (el) => ({
  bgColor: el.bgColor.value,
  textColor: el.textColor.value,
  fontFamily: el.fontFamily.value,
  fontSize: +el.fontSize.value,
  baudRate: +el.baudRate.value,
  dataBits: +el.dataBits.value,
  parity: el.parity.value,
  stopBits: +el.stopBits.value,
  isFullscreen: Boolean(el.doc.fullscreenElement),
  isSettingsModalOpened: !isModalClosed(el.settingsModal),
  isStyleModalOpened: !isModalClosed(el.styleModal),
  isAboutModalOpened: !isModalClosed(el.aboutModal),
  message: el.msg.innerHTML,
  status: el.status.innerText,
});

/**
 * Render port settings
 * @param {AppHTMLElements} el
 * @param {State} state
 * @param {State} oldState
 */
export const renderPortSettings = (el, state, oldState) => {
  if (state.baudRate !== oldState.baudRate) {
    el.baudRate.value = state.baudRate;
  }

  if (state.dataBits !== oldState.dataBits) {
    el.dataBits.value = state.dataBits;
  }

  if (state.parity !== oldState.parity) {
    el.parity.value = state.parity;
  }

  if (state.stopBits !== oldState.stopBits) {
    el.stopBits.value = state.stopBits;
  }
};

/**
 * Bind port settings elements
 * @param {AppHTMLElements} el
 * @param {StateContainer} store
 */
export const bindPortSettings = (el, store) => {
  el.settingsBtn.addEventListener("click", () =>
    store.setState({
      isSettingsModalOpened: true,
      isStyleModalOpened: false,
      isAboutModalOpened: false,
    }),
  );
  el.settingsClose.addEventListener("click", () => {
    store.setState({ isSettingsModalOpened: false });
  });
  el.connectBtn.addEventListener("click", () =>
    store.setState({ isSettingsModalOpened: false }),
  );
  el.disconnectBtn.addEventListener("click", () =>
    store.setState({ isSettingsModalOpened: false }),
  );
  el.baudRate.addEventListener("change", (e) =>
    store.setState({ baudRate: +e.target.value }),
  );
  el.dataBits.addEventListener("change", (e) =>
    store.setState({ dataBits: +e.target.value }),
  );
  el.parity.addEventListener("change", (e) =>
    store.setState({ parity: e.target.value }),
  );
  el.stopBits.addEventListener("change", (e) =>
    store.setState({ stopBits: +e.target.value }),
  );
};

/**
 * Render style settings
 * @param {AppHTMLElements} el
 * @param {State} state
 * @param {State} oldState
 */
export const renderStyleSettings = (el, state, oldState) => {
  if (state.bgColor !== oldState.bgColor) {
    el.bgColor.value = state.bgColor;
  }
  el.doc.body.style.background = state.bgColor;

  if (state.textColor !== oldState.textColor) {
    el.textColor.value = state.textColor;
  }
  el.msg.style.color = state.textColor;

  if (state.fontFamily !== oldState.fontFamily) {
    el.fontFamily.value = state.fontFamily;
  }
  el.msg.style.fontFamily = state.fontFamily;

  if (state.fontSize !== oldState.fontSize) {
    el.fontSize.value = state.fontSize;
  }
  el.msg.style.fontSize = `${state.fontSize}vh`;
};

/**
 * Bind style settings elements
 * @param {AppHTMLElements} el
 * @param {StateContainer} store
 */
export const bindStyleSettings = (el, store) => {
  el.styleBtn.addEventListener("click", () =>
    store.setState({
      isSettingsModalOpened: false,
      isStyleModalOpened: true,
      isAboutModalOpened: false,
    }),
  );
  el.styleClose.addEventListener("click", () =>
    store.setState({ isStyleModalOpened: false }),
  );
  el.bgColor.addEventListener("input", (e) =>
    store.setState({ bgColor: e.target.value }),
  );
  el.textColor.addEventListener("input", (e) =>
    store.setState({ textColor: e.target.value }),
  );
  el.fontFamily.addEventListener("change", (e) =>
    store.setState({ fontFamily: e.target.value }),
  );
  el.fontSize.addEventListener("change", (e) =>
    store.setState({ fontSize: +e.target.value }),
  );
};

/**
 * Bind about elements
 * @param {AppHTMLElements} el
 * @param {StateContainer} store
 */
export const bindAbout = (el, store) => {
  el.aboutBtn.addEventListener("click", () =>
    store.setState({
      isSettingsModalOpened: false,
      isStyleModalOpened: false,
      isAboutModalOpened: true,
    }),
  );
  el.aboutClose.addEventListener("click", () =>
    store.setState({ isAboutModalOpened: false }),
  );
};

/**
 * Render modal state
 * @param {AppHTMLElements} el
 * @param {State} state
 * @param {State} oldState
 */
export const renderModalState = (el, state, oldState) => {
  if (state.isSettingsModalOpened !== oldState.isSettingsModalOpened) {
    if (state.isSettingsModalOpened) openModal(el.settingsModal);
    if (!state.isSettingsModalOpened) closeModal(el.settingsModal);
  }

  if (state.isStyleModalOpened !== oldState.isStyleModalOpened) {
    if (state.isStyleModalOpened) openModal(el.styleModal);
    if (!state.isStyleModalOpened) closeModal(el.styleModal);
  }

  if (state.isAboutModalOpened !== oldState.isAboutModalOpened) {
    if (state.isAboutModalOpened) openModal(el.aboutModal);
    if (!state.isAboutModalOpened) closeModal(el.aboutModal);
  }
};

/**
 * Sanitize HTML before render
 * @param {string} html
 */
export const sanitizeHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // remove script tags
  doc.querySelectorAll("script").forEach((script) => script.remove());

  // remove on* attributes
  doc.querySelectorAll("*").forEach((el) => {
    el.getAttributeNames().forEach((attr) => {
      if (attr.startsWith("on")) el.removeAttribute(attr);
    });
  });

  return doc.body.innerHTML;
};

/**
 * Render messages
 * @param {AppHTMLElements} el
 * @param {State} state
 * @param {State} oldState
 */
export const renderMessages = (el, state, oldState) => {
  if (state.message !== oldState.message) {
    el.msg.innerHTML = sanitizeHtml(state.message);
  }

  if (state.status !== oldState.status) {
    el.status.innerText = state.status;
  }
};

/**
 * Render fullscreen mode
 * @param {AppHTMLElements} el
 * @param {State} state
 */
export const renderFullscreenMode = async (el, state) => {
  const isFullscreen = Boolean(el.doc.fullscreenElement);
  if (state.isFullscreen === isFullscreen) return;
  if (state.isFullscreen && !isFullscreen)
    return el.doc.documentElement.requestFullscreen();
  if (!state.isFullscreen && isFullscreen) return el.doc.exitFullscreen();
};

/**
 * Bind fullscreen DOM
 * @param {AppHTMLElements} el
 * @param {StateContainer} store
 */
export const bindFullscreenMode = (el, store) => {
  el.fullscreenBtn.addEventListener("click", () => {
    const isFullscreen = Boolean(el.doc.fullscreenElement);
    store.setState({ isFullscreen: !isFullscreen });
  });

  el.doc.addEventListener("fullscreenchange", () => {
    const isFullscreen = Boolean(el.doc.fullscreenElement);
    const isFullscreenState = store.getState().isFullscreen;
    if (isFullscreen !== isFullscreenState) {
      store.setState({ isFullscreen });
    }
  });
};

/**
 * Save data from state to DOM elements
 * @param {AppHTMLElements} el
 * @param {State} state
 */
export const renderState = async (el, state) => {
  const oldState = loadStateFromDOM(el);

  renderPortSettings(el, state, oldState);
  renderStyleSettings(el, state, oldState);
  renderModalState(el, state, oldState);
  renderMessages(el, state, oldState);
  await renderFullscreenMode(el, state);
};

/**
 * Bind state to DOM elements
 * @param {AppHTMLElements} el
 * @param {StateContainer} store
 */
export const bindStateToDOM = (el, store) => {
  /** @param {State} state */
  const render = (state) => renderState(el, state);
  store.subscribe(render);

  bindFullscreenMode(el, store);
  bindPortSettings(el, store);
  bindStyleSettings(el, store);
  bindAbout(el, store);
};
