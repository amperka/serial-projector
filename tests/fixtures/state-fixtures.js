/**
 * Common state fixtures used across multiple test files.
 * These fixtures help reduce hardcoded initial states and make tests more maintainable.
 */

/**
 * Default initial state with all properties set to their default values.
 */
export const defaultState = {
  bgColor: "#ffffff",
  textColor: "#000000",
  fontFamily: "Arial",
  fontSize: 16,
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  isFullscreen: false,
  isSettingsModalOpened: false,
  isStyleModalOpened: false,
  isAboutModalOpened: false,
  message: "",
  status: "Disconnected",
  lastPortInfo: null,
};


/**
 * State with custom serial port settings.
 */
export const customPortState = {
  ...defaultState,
  baudRate: 115200,
  dataBits: 7,
  parity: "even",
  stopBits: 2,
};
