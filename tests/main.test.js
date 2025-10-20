import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock document.getElementById before importing main.js
const mockElements = {};

// Set up mock DOM elements
const setupMockElements = () => {
  mockElements.message = { innerHTML: "" };
  mockElements.status = { innerText: "" };
  mockElements.settingsBtn = { addEventListener: vi.fn() };
  mockElements.closeSettings = { addEventListener: vi.fn() };
  mockElements.settingsModal = { style: { display: "none" } };
  mockElements.styleBtn = { addEventListener: vi.fn() };
  mockElements.closeStyle = { addEventListener: vi.fn() };
  mockElements.styleModal = { style: { display: "none" } };
  mockElements.fullscreenBtn = { addEventListener: vi.fn() };
  mockElements.aboutBtn = { addEventListener: vi.fn() };
  mockElements.aboutModal = { style: { display: "none" } };
  mockElements.closeAbout = { addEventListener: vi.fn() };
  mockElements.connectBtn = { addEventListener: vi.fn() };
  mockElements.disconnectBtn = { addEventListener: vi.fn() };
  mockElements.bgColor = { value: "#ffffff" };
  mockElements.textColor = { value: "#000000" };
  mockElements.fontFamily = { value: "Arial" };
  mockElements.fontSize = { value: 16 };
  mockElements.baudRate = { value: 9600 };
  mockElements.dataBits = { value: 8 };
  mockElements.parity = { value: "none" };
  mockElements.stopBits = { value: 1 };
};

// Define mock functions at module level to avoid hoisting issues
const mockedLoadStateFromDOM = vi.fn();
const mockedBindStateToDOM = vi.fn();
const mockedLoadState = vi.fn();
const mockedStateContainer = vi.fn();

// Mock the modules before importing main.js
vi.mock("../src/state.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    StateContainer: mockedStateContainer,
  };
});

vi.mock("../src/ui.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadStateFromDOM: mockedLoadStateFromDOM,
    bindStateToDOM: mockedBindStateToDOM,
  };
});

vi.mock("../src/storage.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadState: mockedLoadState,
    saveState: vi.fn(),
  };
});

vi.mock("../src/port.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Port: vi.fn().mockImplementation(() => ({
      connectTo: vi.fn(),
      connectToPrev: vi.fn(),
      stopReading: vi.fn(),
      forgetAll: vi.fn(),
      getInfo: vi.fn().mockReturnValue({}),
      requestPort: vi.fn(),
    })),
  };
});

// Now import the main module after mocks are set up
let mainModule;

beforeEach(async () => {
  // Reset mocks
  vi.resetModules();
  vi.clearAllMocks();

  // Reset mock function implementations
  mockedLoadStateFromDOM.mockReturnValue({
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
  });

  mockedLoadState.mockReturnValue({});

  mockedStateContainer.mockImplementation(() => ({
    setState: vi.fn().mockReturnThis(),
    getState: vi.fn().mockReturnValue({
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
    }),
    subscribe: vi.fn(),
  }));

  // Set up mock elements
  setupMockElements();

  // Mock document.getElementById
  Object.defineProperty(document, "getElementById", {
    value: vi.fn((id) => mockElements[id] || null),
    writable: true,
  });

  // Mock navigator.serial
  Object.defineProperty(navigator, "serial", {
    value: {
      requestPort: vi.fn(),
      getPorts: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Mock console
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});

  // Import the module after mocks are set up
  mainModule = await import("../src/main.js");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("main.js", () => {
  describe("debounce", () => {
    it("should delay function execution", async () => {
      const func = vi.fn();
      const debouncedFunc = mainModule.debounce(func, 100);
      debouncedFunc();
      expect(func).not.toHaveBeenCalled();
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(func).toHaveBeenCalledTimes(1);
    });

    it("should reset timer on multiple calls", async () => {
      const func = vi.fn();
      const debouncedFunc = mainModule.debounce(func, 100);
      debouncedFunc();
      setTimeout(() => debouncedFunc(), 50);
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe("makePortHandlers", () => {
    it("should create port event handlers that update store state", () => {
      // Create a mock store with setState method
      const mockStore = {
        setState: vi.fn().mockReturnThis(),
      };

      const handlers = mainModule.makePortHandlers(mockStore);
      const mockPort = { getInfo: vi.fn().mockReturnValue({}) };

      // Test onConnect
      handlers.onConnect(mockPort);
      expect(mockStore.setState).toHaveBeenNthCalledWith(1, {
        lastPortInfo: null,
      });
      expect(mockStore.setState).toHaveBeenNthCalledWith(2, {
        lastPortInfo: {},
        status: "Connected",
      });

      // Test onDisconnect
      handlers.onDisconnect();
      expect(mockStore.setState).toHaveBeenNthCalledWith(3, {
        status: "Disconnected",
      });

      // Test onError
      const error = new Error("Test error");
      handlers.onError(error);
      expect(mockStore.setState).toHaveBeenNthCalledWith(4, {
        status: `Error: ${error.message}`,
      });

      // Test onMessage
      const message = "Test message";
      handlers.onMessage(message);
      expect(mockStore.setState).toHaveBeenNthCalledWith(5, {
        message,
        status: "Receiving...",
      });
    });
  });

  describe("getPortOptsFromState", () => {
    it("should extract SerialOptions from state", () => {
      const state = {
        baudRate: 115200,
        dataBits: 7,
        parity: "even",
        stopBits: 2,
      };
      const opts = mainModule.getPortOptsFromState(state);
      expect(opts).toEqual({
        baudRate: 115200,
        dataBits: 7,
        parity: "even",
        stopBits: 2,
      });
    });
  });

  describe("getStore", () => {
    it("should create a StateContainer with state loaded from DOM", () => {
      const expectedState = {
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
      mainModule.getStore(mockElements);
      expect(mockedLoadStateFromDOM).toHaveBeenCalledWith(mockElements);
      expect(mockedStateContainer).toHaveBeenCalledWith(expectedState);
    });
  });

  describe("init", () => {
    it("should throw error if Web Serial API is not supported", async () => {
      // Mock navigator without serial
      const originalSerial = navigator.serial;

      // Create a new navigator object without serial property
      const mockNavigator = {};
      for (const prop in navigator) {
        if (prop !== "serial") {
          mockNavigator[prop] = navigator[prop];
        }
      }

      // Use window instead of global for browser environment
      Object.defineProperty(window, "navigator", {
        value: mockNavigator,
        writable: true,
        configurable: true,
      });

      try {
        const mockStore = {
          setState: vi.fn().mockReturnThis(),
          getState: vi.fn().mockReturnValue({ lastPortInfo: null }),
          subscribe: vi.fn(),
        };

        await expect(mainModule.init(mockStore)).rejects.toThrow(
          "Not supported browser",
        );
        expect(mockStore.setState).toHaveBeenCalledWith({
          status: "💥 Web Serial API is not supported in your browser ☠️",
          message: "Not supported browser",
        });
      } finally {
        // Restore original navigator
        Object.defineProperty(window, "navigator", {
          value: originalSerial
            ? { ...navigator, serial: originalSerial }
            : navigator,
          writable: true,
          configurable: true,
        });
      }
    });

    it("should initialize app with supported browser", async () => {
      const mockStore = {
        setState: vi.fn().mockReturnThis(),
        getState: vi.fn().mockReturnValue({
          baudRate: 9600,
          dataBits: 8,
          parity: "none",
          stopBits: 1,
          lastPortInfo: null,
        }),
        subscribe: vi.fn(),
      };
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
      };
      const MockPortClass = vi.fn().mockImplementation(() => mockPort);

      const mockConnectBtn = { addEventListener: vi.fn() };
      const mockDisconnectBtn = { addEventListener: vi.fn() };

      await mainModule.init(
        mockStore,
        MockPortClass,
        mockConnectBtn,
        mockDisconnectBtn,
      );

      expect(mockedBindStateToDOM).toHaveBeenCalled();
      expect(mockedLoadState).toHaveBeenCalled();
      expect(mockStore.subscribe).toHaveBeenCalled();
      expect(MockPortClass).toHaveBeenCalled();
      expect(mockConnectBtn.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      );
      expect(mockDisconnectBtn.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      );
      expect(navigator.serial.addEventListener).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
      expect(mockPort.connectToPrev).toHaveBeenCalledWith(null);
    });

    it("should handle manual connect error", async () => {
      const mockStore = {
        setState: vi.fn().mockReturnThis(),
        getState: vi.fn().mockReturnValue({
          baudRate: 9600,
          dataBits: 8,
          parity: "none",
          stopBits: 1,
          lastPortInfo: null,
        }),
        subscribe: vi.fn(),
      };
      const mockPort = {
        connectTo: vi.fn().mockRejectedValue(new Error("Connect failed")),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn().mockResolvedValue({}),
      };
      const MockPortClass = vi.fn().mockImplementation(() => mockPort);

      const mockConnectBtn = { addEventListener: vi.fn() };
      const mockDisconnectBtn = { addEventListener: vi.fn() };

      await mainModule.init(
        mockStore,
        MockPortClass,
        mockConnectBtn,
        mockDisconnectBtn,
      );

      // Trigger the click handler
      const clickHandler = mockConnectBtn.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(mockStore.setState).toHaveBeenCalledWith({
        status: "Error: Connect failed",
      });
    });
  });
});
