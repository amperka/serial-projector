import { describe, expect, it, vi } from "vitest";
import { vi } from "vitest";

/**
 * Resets all global mocks to ensure test isolation.
 * Call this in afterEach blocks to prevent state leakage between tests.
 *
 * This function:
 * - Restores all mocked implementations to their original behavior
 * - Clears all mock call history and recorded data
 * - Prevents test pollution by ensuring clean state between tests
 */
export function resetGlobalMocks() {
  vi.restoreAllMocks();
  vi.clearAllMocks();
}

/**
 * Sets up a complete test environment with all common mocks.
 * This is a convenience function that calls multiple setup functions.
 *
 * This function provides a one-stop setup for tests that need:
 * - Mock DOM elements (buttons, inputs, modals, etc.)
 * - Mock document.getElementById implementation
 * - Mock navigator.serial API for Web Serial testing
 * - Mock console methods to suppress test output
 * - Mock localStorage for storage testing
 *
 * @returns {Object} An object containing:
 *   - mockElements: All mock DOM elements
 *   - resetMocks: Function to reset all mocks
 */
export function setupTestEnvironment() {
  const mockElements = setupMockElements();
  mockDocumentGetElementById(mockElements);
  mockNavigatorSerial();
  mockConsole();
  mockLocalStorage();

  return {
    mockElements,
    resetMocks: resetGlobalMocks,
  };
}

/**
 * Sets up common mock DOM elements used in tests.
 * Returns an object containing all mock elements with default properties.
 *
 * This factory creates mock representations of all DOM elements used
 * throughout the application, including:
 * - Message and status display elements
 * - Modal dialogs (settings, style, about)
 * - Control buttons (connect, disconnect, fullscreen, etc.)
 * - Input elements for configuration (colors, fonts, serial settings)
 *
 * Each element has the minimal properties needed for testing:
 * - addEventListener mock for event handling
 * - value property for inputs
 * - innerHTML/innerText for display elements
 * - style object for CSS property testing
 *
 * @returns {Object} An object containing all mock DOM elements
 */
export function setupMockElements() {
  const mockElements = {
    message: { innerHTML: "" },
    status: { innerText: "" },
    settingsBtn: { addEventListener: vi.fn() },
    closeSettings: { addEventListener: vi.fn() },
    settingsModal: { style: { display: "none" } },
    styleBtn: { addEventListener: vi.fn() },
    closeStyle: { addEventListener: vi.fn() },
    styleModal: { style: { display: "none" } },
    fullscreenBtn: { addEventListener: vi.fn() },
    aboutBtn: { addEventListener: vi.fn() },
    aboutModal: { style: { display: "none" } },
    closeAbout: { addEventListener: vi.fn() },
    connectBtn: { addEventListener: vi.fn() },
    disconnectBtn: { addEventListener: vi.fn() },
    bgColor: { value: "#ffffff" },
    textColor: { value: "#000000" },
    fontFamily: { value: "Arial" },
    fontSize: { value: 16 },
    baudRate: { value: 9600 },
    dataBits: { value: 8 },
    parity: { value: "none" },
    stopBits: { value: 1 },
  };
  return mockElements;
}

/**
 * Mocks document.getElementById to return elements from the provided mockElements object.
 *
 * This replaces the global document.getElementById function with a mock that:
 * - Returns mock elements when their ID is requested
 * - Returns null for unknown IDs (mimicking real DOM behavior)
 * - Is writable so it can be restored after tests
 *
 * @param {Object} mockElements - The object containing mock elements,
 *                                where keys are element IDs and values are mock objects
 */
export function mockDocumentGetElementById(mockElements) {
  Object.defineProperty(document, "getElementById", {
    value: vi.fn((id) => mockElements[id] || null),
    writable: true,
  });
}

/**
 * Mocks navigator.serial with default or provided options.
 *
 * This function creates a mock Web Serial API implementation for testing:
 * - requestPort: Mock function for port selection dialog
 * - getPorts: Mock function returning list of available ports (default empty)
 * - addEventListener: Mock function for connection/disconnection events
 *
 * The mock is configurable via options parameter and can be restored after tests.
 *
 * @param {Object} options - Optional overrides for the serial mock properties.
 *                         Any properties not provided will use default mocks.
 * @returns {Object} The mocked navigator.serial object for further customization
 */
export function mockNavigatorSerial(options = {}) {
  const defaultMock = {
    requestPort: vi.fn(),
    getPorts: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
  };
  const mock = { ...defaultMock, ...options };
  Object.defineProperty(navigator, "serial", {
    value: mock,
    writable: true,
    configurable: true,
  });
  return mock;
}

/**
 * Mocks localStorage globally using vi.stubGlobal.
 *
 * Creates a complete localStorage mock with all standard methods:
 * - getItem: Mock function for retrieving values
 * - setItem: Mock function for storing values
 * - removeItem: Mock function for deleting values
 * - clear: Mock function for clearing all values
 *
 * Uses vi.stubGlobal to replace the global localStorage object,
 * ensuring the mock is available throughout the test environment.
 *
 * @returns {Object} The mocked localStorage object with vi.fn() spies
 */
export function mockLocalStorage() {
  const mockStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal("localStorage", mockStorage);
  return mockStorage;
}

/**
 * Spies on console methods (info, error, debug) to suppress output in tests.
 *
 * This function:
 * - Creates spies on console methods to track calls without outputting
 * - Suppresses console noise during test execution
 * - Still allows testing that console methods were called with specific arguments
 * - Uses mockImplementation to prevent actual console output
 *
 * Methods mocked:
 * - info: For general informational messages
 * - error: For error messages (prevents test output pollution)
 * - debug: For debug messages
 */
export function mockConsole() {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
}

/**
 * Creates a mock button element with addEventListener and click methods.
 *
 * This factory creates a button mock that:
 * - Tracks event listeners added via addEventListener
 * - Provides a click() method to simulate button clicks
 * - Stores listeners internally for test inspection
 * - Mimics real button behavior for event handling
 *
 * @returns {Object} Mock button element with:
 *   - addEventListener: Mock function that stores callbacks
 *   - click: Function that triggers the click callback
 *   - _eventListeners: Internal storage for test inspection
 */
export function createMockButton() {
  const eventListeners = {};
  return {
    addEventListener: vi.fn((event, callback) => {
      eventListeners[event] = callback;
    }),
    click: vi.fn(function () {
      if (eventListeners.click) {
        eventListeners.click();
      }
    }),
    _eventListeners: eventListeners,
  };
}

/**
 * Creates a mock input element with value, addEventListener, and dispatchEvent methods.
 *
 * This factory creates an input mock that:
 * - Has a mutable value property for testing input changes
 * - Tracks event listeners for different event types
 * - Provides dispatchEvent to simulate DOM events
 * - Sets event.target to the mock element for realistic event handling
 *
 * @returns {Object} Mock input element with:
 *   - value: Mutable string property
 *   - addEventListener: Mock function storing event callbacks
 *   - dispatchEvent: Function to trigger stored event callbacks
 *   - _eventListeners: Internal storage for test inspection
 */
export function createMockInput() {
  const eventListeners = {};
  const mockElement = {
    value: "",
    addEventListener: vi.fn((event, callback) => {
      eventListeners[event] = callback;
    }),
    dispatchEvent: vi.fn(function (event) {
      if (eventListeners[event.type]) {
        eventListeners[event.type]({ ...event, target: mockElement });
      }
    }),
    _eventListeners: eventListeners,
  };
  return mockElement;
}

/**
 * Creates a mock div element with innerHTML, innerText, and style properties.
 *
 * This factory creates a simple div mock with the most commonly used properties:
 * - innerHTML: Mutable string for HTML content testing
 * - innerText: Mutable string for text content testing
 * - style: Object for CSS property testing
 * - addEventListener: Mock for event handling (though rarely used on divs)
 *
 * @returns {Object} Mock div element with basic DOM properties
 */
export function createMockDiv() {
  return {
    innerHTML: "",
    innerText: "",
    style: {},
    addEventListener: vi.fn(),
  };
}

/**
 * Creates a mock modal element with style.display property.
 *
 * This factory creates a modal mock focused on visibility testing:
 * - style.display: Mutable property for show/hide testing
 * - addEventListener: Mock for event handling (close events, etc.)
 *
 * @param {string} initialDisplay - Initial display value (default: "none").
 *                                 Common values: "none", "flex", "block"
 * @returns {Object} Mock modal element with visibility control
 */
export function createMockModal(initialDisplay = "none") {
  return {
    style: { display: initialDisplay },
    addEventListener: vi.fn(),
  };
}

/**
 * Creates a mock document object with fullscreen properties.
 *
 * This factory creates a document mock for fullscreen API testing:
 * - fullscreenElement: Tracks current fullscreen element
 * - documentElement.requestFullscreen: Mock for entering fullscreen
 * - exitFullscreen: Mock for exiting fullscreen
 * - body.style: For testing body CSS changes
 * - Event handling: For fullscreenchange events
 *
 * @returns {Object} Mock document object with fullscreen API support
 */
export function createMockDocument() {
  const eventListeners = {};
  return {
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: vi.fn(),
    },
    exitFullscreen: vi.fn(),
    body: { style: {} },
    addEventListener: vi.fn((event, callback) => {
      eventListeners[event] = callback;
    }),
    dispatchEvent: vi.fn(function (event) {
      if (eventListeners[event.type]) {
        eventListeners[event.type](event);
      }
    }),
    _eventListeners: eventListeners,
  };
}

/**
 * Creates a mock store with setState, getState, and subscribe methods.
 *
 * This factory creates a store mock that mimics the StateContainer interface:
 * - setState: Mock function that returns this for chaining
 * - getState: Mock function returning the provided initial state
 * - subscribe: Mock function managing listener subscription/unsubscription
 * - _listeners: Internal Set for tracking subscribed listeners
 *
 * The mock supports testing:
 * - State update calls and their arguments
 * - State retrieval and returned values
 * - Subscription management and listener tracking
 *
 * @param {Object} initialState - Initial state for the store to return
 * @returns {Object} Mock store object with StateContainer-like interface
 */
export function createMockStore(initialState = {}) {
  const listeners = new Set();
  return {
    setState: vi.fn().mockReturnThis(),
    getState: vi.fn().mockReturnValue(initialState),
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    _listeners: listeners,
  };
}

/**
 * Helper function to verify state updates in order.
 * Useful for testing sequences of setState calls.
 *
 * This helper simplifies testing of multiple state updates by:
 * - Checking the total number of setState calls
 * - Verifying each call was made with the expected arguments
 * - Providing clear error messages when expectations don't match
 *
 * Example usage:
 *   verifyStateUpdates(mockSetState, [
 *     { status: "Connecting..." },
 *     { status: "Connected" }
 *   ]);
 *
 * @param {Object} mockSetState - Mocked setState function from vi.fn()
 * @param {Array} expectedUpdates - Array of expected state update objects in order
 */
export function verifyStateUpdates(mockSetState, expectedUpdates) {
  expect(mockSetState).toHaveBeenCalledTimes(expectedUpdates.length);
  expectedUpdates.forEach((update, index) => {
    expect(mockSetState).toHaveBeenNthCalledWith(index + 1, update);
  });
}
