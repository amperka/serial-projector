/**
 * @typedef {object} State
 * @property {string} bgColor - Background color
 * @property {string} textColor - Text color
 * @property {string} fontFamily - Font family
 * @property {number} fontSize - Font size
 * @property {number} baudRate - Baud rate
 * @property {number} dataBits - Data bits
 * @property {string} parity - Parity
 * @property {number} stopBits - Stop bits
 * @property {boolean} isFullscreen - Fullscreen mode state
 * @property {boolean} isSettingsModalOpened - Settings modal state
 * @property {boolean} isStyleModalOpened - Style modal state
 * @property {boolean} isAboutModalOpened - About modal state
 * @property {string} message - Message text
 * @property {string} status - Status text
 * @property {SerialPortInfo} lastPortInfo - Last connected port's info
 */

/**
 * @typedef {(state: State) => Promise<*> | *} StateListener
 */

/**
 * State container
 */
export class StateContainer {
  #state;
  #listeners;

  /**
   * @param {State} initialState
   * @param {Set<StateListener>} [listeners]
   */
  constructor(initialState, listeners) {
    this.#state = initialState;
    this.#listeners = listeners || new Set();
  }

  /**
   * Returns a shallow copy of state
   * @returns {State}
   */
  getState() {
    return { ...this.#state };
  }

  /**
   * Update state and notify all subscribed listeners
   * @param {Partial<State>} partialState
   */
  setState(partialState) {
    /** @type {State} */
    const updatedState = { ...this.#state };
    Object.keys(partialState).forEach((key) => {
      if (typeof partialState[key] === "object" && partialState[key] !== null) {
        updatedState[key] = { ...this.#state[key], ...partialState[key] };
      } else {
        updatedState[key] = partialState[key];
      }
    });
    this.#state = updatedState;
    this.#notify();
    console.debug("[StateContainer] setState() - new state:", this.#state);
    return this;
  }

  /**
   * Subscribe to the state changes
   * @param {StateListener} listener
   * @returns {() => bool}
   */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /**
   * Unsubscribe listener
   * @param {StateListener} listener
   * @returns {bool}
   */
  unsubscribe(listener) {
    return this.#listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  #notify() {
    this.#listeners.forEach((listener) => listener(this.getState()));
  }
}
