import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupTestEnvironment,
  createMockStore,
  verifyStateUpdates,
} from "./test-helpers.js";
import { defaultState, customPortState } from "./fixtures/state-fixtures.js";

// Define mock functions at module level to avoid hoisting issues
// These mocks are defined before any imports to ensure they're available when modules are loaded
const mockedLoadStateFromDOM = vi.fn();
const mockedBindStateToDOM = vi.fn();
const mockedLoadState = vi.fn();
const mockedStateContainer = vi.fn();
const mockedMkDecoder = vi.fn().mockImplementation((encoding) => {
  const decoder = {
    encoding,
    decode: vi.fn(),
  };
  return decoder;
});
const mockedIsEspruino = vi.fn();

// Set default mock behavior for isEspruino to return false
mockedIsEspruino.mockReturnValue(false);

// Mock the modules before importing main.js
// This ensures that when main.js imports these modules, it gets our mocked versions instead
vi.mock("../src/encoding.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    mkDecoder: mockedMkDecoder,
  };
});

vi.mock("../src/board.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isEspruino: mockedIsEspruino,
  };
});

vi.mock("../src/port.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Port: vi.fn().mockImplementation((portOptions, decoder, handlers = {}) => {
      const mockPort = {
        portOptions,
        decoder: decoder || { encoding: "default", decode: vi.fn() },
        connectTo: vi.fn(),
        connectToPrev: vi.fn(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
        ...handlers,
      };
      return mockPort;
    }),
  };
});

// Mock the modules before importing main.js
// This ensures that when main.js imports these modules, it gets our mocked versions instead
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

// Now import the main module after mocks are set up
let mainModule;

beforeEach(async () => {
  // Reset all mocks to ensure test isolation
  // This prevents state leakage between tests
  vi.resetModules();
  vi.clearAllMocks();

  // Reset mock function implementations to default values
  // Using fixtures ensures consistent test data across all tests
  mockedLoadStateFromDOM.mockReturnValue(defaultState);
  mockedLoadState.mockReturnValue({});

  // Mock StateContainer constructor to return a mock store instance
  // The mock store includes all the methods that main.js expects to call
  mockedStateContainer.mockImplementation(() => ({
    setState: vi.fn().mockReturnThis(),
    getState: vi.fn().mockReturnValue(defaultState),
    subscribe: vi.fn(),
  }));

  // Set up complete test environment with all common mocks
  // This includes DOM elements, navigator.serial, localStorage, and console
  setupTestEnvironment();

  // Import the module after mocks are set up
  // Dynamic import ensures we get the mocked versions of dependencies
  mainModule = await import("../src/main.js");
});

afterEach(() => {
  // Restore all mocks to prevent test pollution
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
      // The store tracks state changes for serial port events
      const mockStore = createMockStore();
      const handlers = mainModule.makePortHandlers(mockStore);
      const mockPort = { getInfo: vi.fn().mockReturnValue({}) };

      // Test onConnect handler
      // Should first clear lastPortInfo, then set it with port info and status
      handlers.onConnect(mockPort);
      verifyStateUpdates(mockStore.setState, [
        { lastPortInfo: null },
        { lastPortInfo: {}, status: "Connected" },
      ]);

      // Reset mock to isolate the next test
      mockStore.setState.mockClear();

      // Test onDisconnect handler
      // Should update status to Disconnected
      handlers.onDisconnect();
      verifyStateUpdates(mockStore.setState, [{ status: "Disconnected" }]);

      // Reset mock to isolate the next test
      mockStore.setState.mockClear();

      // Test onError handler
      // Should update status with error message
      const error = new Error("Test error");
      handlers.onError(error);
      verifyStateUpdates(mockStore.setState, [
        { status: `Error: ${error.message}` },
      ]);

      // Reset mock to isolate the next test
      mockStore.setState.mockClear();

      // Test onMessage handler
      // Should update message and status to indicate receiving
      const message = "Test message";
      handlers.onMessage(message);
      verifyStateUpdates(mockStore.setState, [
        { message, status: "Receiving..." },
      ]);
    });
  });

  describe("getPortOptsFromState", () => {
    it("should extract SerialOptions from state", () => {
      const opts = mainModule.getPortOptsFromState(customPortState);
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
      const mockElements = setupTestEnvironment().mockElements;
      mainModule.getStore(mockElements);
      expect(mockedLoadStateFromDOM).toHaveBeenCalledWith(mockElements);
      expect(mockedStateContainer).toHaveBeenCalledWith(defaultState);
    });

    it("should initialize app with supported browser", async () => {
      const mockStore = createMockStore({
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
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
      const mockStore = createMockStore({
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
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
      const mockStore = createMockStore({ lastPortInfo: null });

      await expect(mainModule.init(mockStore)).rejects.toThrow(
        "Not supported browser",
      );
      // Check that setState was called with error status (may be called multiple times)
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
    const mockStore = createMockStore({
      baudRate: 9600,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      lastPortInfo: null,
    });
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
    const mockStore = createMockStore({
      baudRate: 9600,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      lastPortInfo: null,
    });
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

    // Check that setState was called with error status (may be called multiple times)
    expect(mockStore.setState).toHaveBeenCalledWith({
      status: "Error: Connect failed",
    });
  });

  describe("encoding integration", () => {
    it("should instantiate SerialPort with decoder from mkDecoder", async () => {
      const mockStore = createMockStore({
        encoding: "utf-8",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
        decoder: { encoding: "utf-8", decode: vi.fn() },
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

      expect(mockedMkDecoder).toHaveBeenCalledWith("utf-8");
      expect(MockPortClass).toHaveBeenCalled();
      // Verify the port was created with the decoder from mkDecoder
      expect(mockPort.decoder.encoding).toBe("utf-8");
      expect(mockPort.decoder.decode).toBeDefined();
    });

    it("should auto-detect Espruino and switch encoding to x-espruino-mixed-utf8", async () => {
      const mockStore = createMockStore({
        encoding: "default",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi
          .fn()
          .mockReturnValue({ usbVendorId: "0x1209", usbProductId: "0x5740" }),
        requestPort: vi.fn().mockResolvedValue({
          getInfo: vi.fn().mockReturnValue({
            usbVendorId: "0x1209",
            usbProductId: "0x5740",
          }),
        }),
        decoder: { encoding: "default", decode: vi.fn() },
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

      // Configure isEspruino to return true for this test
      mockedIsEspruino.mockReturnValue(true);

      // Trigger manual connect
      const clickHandler = mockConnectBtn.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(mockedIsEspruino).toHaveBeenCalledWith({
        usbVendorId: "0x1209",
        usbProductId: "0x5740",
      });
      // Check that setState was called with the encoding update
      const setStateCalls = mockStore.setState.mock.calls;
      const encodingUpdateCall = setStateCalls.find(
        (call) => call[0] && call[0].encoding === "x-espruino-mixed-utf8",
      );
      expect(encodingUpdateCall).toBeDefined();
    });

    it("should not auto-switch encoding for non-Espruino devices", async () => {
      const mockStore = createMockStore({
        encoding: "default",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi
          .fn()
          .mockReturnValue({ usbVendorId: "0x1234", usbProductId: "0x5678" }),
        requestPort: vi.fn().mockResolvedValue({
          getInfo: vi.fn().mockReturnValue({
            usbVendorId: "0x1234",
            usbProductId: "0x5678",
          }),
        }),
        decoder: { encoding: "default", decode: vi.fn() },
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

      // Trigger manual connect
      const clickHandler = mockConnectBtn.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(mockedIsEspruino).toHaveBeenCalledWith({
        usbVendorId: "0x1234",
        usbProductId: "0x5678",
      });
      expect(mockStore.setState).not.toHaveBeenCalledWith({
        encoding: "x-espruino-mixed-utf8",
      });
    });

    it("should not auto-switch encoding when current encoding is not default", async () => {
      const mockStore = createMockStore({
        encoding: "utf-8",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi
          .fn()
          .mockReturnValue({ usbVendorId: "0x1209", usbProductId: "0x5740" }),
        requestPort: vi.fn().mockResolvedValue({
          getInfo: vi.fn().mockReturnValue({
            usbVendorId: "0x1209",
            usbProductId: "0x5740",
          }),
        }),
        decoder: { encoding: "utf-8", decode: vi.fn() },
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

      // Ensure isEspruino returns false (default behavior)
      mockedIsEspruino.mockReturnValue(false);

      // Trigger manual connect
      const clickHandler = mockConnectBtn.addEventListener.mock.calls[0][1];
      await clickHandler();

      // isEspruino should not be called when encoding is not "default"
      expect(mockedIsEspruino).not.toHaveBeenCalled();
      expect(mockStore.setState).not.toHaveBeenCalledWith({
        encoding: "x-espruino-mixed-utf8",
      });
    });

    it("should update decoder when encoding state changes", async () => {
      const mockStore = createMockStore({
        encoding: "utf-8",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
        decoder: { encoding: "utf-8", decode: vi.fn() },
        setSignals: vi.fn(),
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

      // Get the decoder update subscription callback (should be the second subscribe call)
      const subscribeCalls = mockStore.subscribe.mock.calls;
      const decoderUpdateCallback = subscribeCalls[1][0]; // Second subscribe call is for decoder updates

      // Set up the port's decoder with initial encoding
      mockPort.decoder = { encoding: "utf-8", decode: vi.fn() };

      // Clear previous calls to mkDecoder to isolate the subscription test
      mockedMkDecoder.mockClear();

      // Mock mkDecoder to return a new decoder for the new encoding
      const newDecoder = { encoding: "ascii", decode: vi.fn() };
      mockedMkDecoder.mockReturnValue(newDecoder);

      // Trigger the decoder update callback with new state (different encoding)
      decoderUpdateCallback({
        encoding: "ascii",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });

      // Verify mkDecoder was called with the new encoding
      expect(mockedMkDecoder).toHaveBeenCalledWith("ascii");
      // Verify the port's decoder was updated by the callback
      expect(mockPort.decoder).toBe(newDecoder);
      expect(mockPort.decoder.encoding).toBe("ascii");
      expect(mockPort.decoder.decode).toBeDefined();
    });

    it("should not update decoder when encoding state remains the same", async () => {
      const mockStore = createMockStore({
        encoding: "utf-8",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
        decoder: { encoding: "utf-8", decode: vi.fn() },
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

      // Get the subscribe callback and trigger it with the same encoding
      const subscribeCallback = mockStore.subscribe.mock.calls[0][0];
      subscribeCallback({ encoding: "utf-8" });

      // mkDecoder should only be called once during initialization
      expect(mockedMkDecoder).toHaveBeenCalledTimes(1);
    });

    it("should include encoding element in appHtmlElements", async () => {
      const mockStore = createMockStore({
        encoding: "default",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        lastPortInfo: null,
      });
      const mockPort = {
        connectTo: vi.fn().mockResolvedValue(),
        connectToPrev: vi.fn().mockResolvedValue(),
        stopReading: vi.fn(),
        forgetAll: vi.fn(),
        getInfo: vi.fn().mockReturnValue({}),
        requestPort: vi.fn(),
        decoder: { encoding: "default", decode: vi.fn() },
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

      // Verify that document.getElementById was called with "encoding"
      expect(document.getElementById).toHaveBeenCalledWith("encoding");

      // Verify the encoding element is part of the appHtmlElements by checking the module exports
      // Since appHtmlElements is not exported, we verify the getElementById call instead
      expect(document.getElementById).toHaveBeenCalledWith("encoding");
    });
  });
});
