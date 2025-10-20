import { describe, it, expect, beforeEach, vi } from "vitest";
import { Port } from "../src/port.js";

describe("Port", () => {
  let mockSerial;
  let mockPort;
  let mockReader;
  let mockWriter;

  beforeEach(() => {
    mockWriter = {
      write: vi.fn(),
      releaseLock: vi.fn(),
    };

    mockReader = {
      read: vi.fn(),
      releaseLock: vi.fn(),
      cancel: vi.fn(),
    };

    mockPort = {
      open: vi.fn(),
      close: vi.fn(),
      forget: vi.fn(),
      getInfo: vi.fn(),
      readable: {
        getReader: vi.fn(() => mockReader),
      },
      writable: {
        getWriter: vi.fn(() => mockWriter),
      },
    };

    mockSerial = {
      requestPort: vi.fn(),
      getPorts: vi.fn(),
    };

    vi.stubGlobal("navigator", {
      serial: mockSerial,
    });
  });

  describe("constructor", () => {
    it("should set event handlers", () => {
      const handlers = {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onError: vi.fn(),
        onMessage: vi.fn(),
      };
      const port = new Port({}, handlers);
      expect(port.onConnect).toBe(handlers.onConnect);
      expect(port.onDisconnect).toBe(handlers.onDisconnect);
      expect(port.onError).toBe(handlers.onError);
      expect(port.onMessage).toBe(handlers.onMessage);
    });

    it("should set default doNothing handlers if not provided", () => {
      const port = new Port({}, {});
      expect(typeof port.onConnect).toBe("function");
      expect(typeof port.onDisconnect).toBe("function");
      expect(typeof port.onError).toBe("function");
      expect(typeof port.onMessage).toBe("function");
    });

    it("should set portOptions", () => {
      const options = { baudRate: 9600 };
      const port = new Port(options, {});
      expect(port.portOptions).toBe(options);
    });
  });

  describe("requestPort", () => {
    it("should call navigator.serial.requestPort", async () => {
      mockSerial.requestPort.mockResolvedValue(mockPort);
      const port = new Port({}, {});
      const result = await port.requestPort();
      expect(mockSerial.requestPort).toHaveBeenCalled();
      expect(result).toBe(mockPort);
    });
  });

  describe("getPrevPort", () => {
    it("should return matching port", async () => {
      const prevInfo = { vendorId: "1234", productId: "5678" };
      mockPort.getInfo.mockReturnValue(prevInfo);
      mockSerial.getPorts.mockResolvedValue([mockPort]);
      const port = new Port({}, {});
      const result = await port.getPrevPort(prevInfo);
      expect(result).toBe(mockPort);
    });

    it("should return false if no matching port", async () => {
      mockPort.getInfo.mockReturnValue({ vendorId: "9999" });
      mockSerial.getPorts.mockResolvedValue([mockPort]);
      const port = new Port({}, {});
      const result = await port.getPrevPort({ vendorId: "1234" });
      expect(result).toBe(false);
    });

    it("should return false if no ports", async () => {
      mockSerial.getPorts.mockResolvedValue([]);
      const port = new Port({}, {});
      const result = await port.getPrevPort({ vendorId: "1234" });
      expect(result).toBe(false);
    });
  });

  describe("handleVT100Codes", () => {
    it("should handle erase display codes", () => {
      const port = new Port({}, {});
      expect(port.handleVT100Codes("before\x1b[2Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[0Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[1Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[3Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x33[2Jafter")).toBe("after");
    });

    it("should handle erase line codes", () => {
      const port = new Port({}, {});
      expect(port.handleVT100Codes("before\x1b[Kafter")).toBe("before");
      expect(port.handleVT100Codes("before\x1b[0Kafter")).toBe("before");
      expect(port.handleVT100Codes("before\x1b[1Kafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[2Kafter")).toBe("");
    });

    it("should handle backspace codes", () => {
      const port = new Port({}, {});
      expect(port.handleVT100Codes("abc\x08d")).toBe("abd");
      expect(port.handleVT100Codes("\x08abc")).toBe("abc");
      expect(port.handleVT100Codes("a\x08\x08bc")).toBe("bc");
    });

    it("should return unchanged if no codes", () => {
      const port = new Port({}, {});
      expect(port.handleVT100Codes("hello world")).toBe("hello world");
    });
  });

  describe("readUntilClosed", () => {
    it("should read messages and call onMessage", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, { onMessage, onDisconnect: vi.fn() });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("hello\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("world\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("hello");
      expect(onMessage).toHaveBeenCalledWith("world");
    });

    it("should handle VT100 codes in messages", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, { onMessage, onDisconnect: vi.fn() });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("before\x1b[2Jafter\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("after");
    });

    it("should call onError on read error", async () => {
      const onError = vi.fn();
      const port = new Port({}, { onError, onDisconnect: vi.fn() });
      mockReader.read.mockRejectedValue(new Error("read error"));
      await port.connectTo(mockPort);
      expect(onError).toHaveBeenCalledWith(new Error("read error"));
    });

    it("should call onDisconnect when done", async () => {
      const onDisconnect = vi.fn();
      const port = new Port({}, { onDisconnect });
      mockReader.read.mockResolvedValue({ done: true });
      await port.connectTo(mockPort);
      expect(onDisconnect).toHaveBeenCalled();
    });

    it("should return early if no port is set", async () => {
      const port = new Port({}, {});
      await expect(port.readUntilClosed()).resolves.toBeUndefined();
    });
  });

  describe("stopReading", () => {
    it("should cancel reader and wait for close", async () => {
      const port = new Port({}, {});
      await port.connectTo(mockPort);
      await port.stopReading();
      expect(mockReader.cancel).toHaveBeenCalled();
    });
  });

  describe("forgetAll", () => {
    it("should forget current port and all ports", async () => {
      mockSerial.getPorts.mockResolvedValue([mockPort, mockPort]);
      const port = new Port({}, {});
      await port.connectTo(mockPort);
      await port.forgetAll();
      expect(mockPort.forget).toHaveBeenCalledTimes(3); // current + two from getPorts
    });
  });

  describe("connectTo", () => {
    it("should open port, call onConnect, and start reading", async () => {
      const onConnect = vi.fn();
      const port = new Port({ baudRate: 9600 }, { onConnect });
      mockReader.read.mockResolvedValue({ done: true });
      await port.connectTo(mockPort);
      expect(mockPort.open).toHaveBeenCalledWith({ baudRate: 9600 });
      expect(onConnect).toHaveBeenCalledWith(mockPort);
    });
  });

  describe("connectToPrev", () => {
    it("should connect to previous port if found", async () => {
      const prevInfo = { vendorId: "1234" };
      mockPort.getInfo.mockReturnValue(prevInfo);
      mockSerial.getPorts.mockResolvedValue([mockPort]);
      const port = new Port({}, {});
      const result = await port.connectToPrev(prevInfo);
      expect(mockPort.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if no previous port", async () => {
      mockSerial.getPorts.mockResolvedValue([]);
      const port = new Port({}, {});
      const result = await port.connectToPrev({ vendorId: "1234" });
      expect(result).toBe(false);
    });
  });

  describe("write", () => {
    it("should write string message", async () => {
      const port = new Port({});
      await port.connectTo(mockPort);
      await port.write("hello");
      expect(mockWriter.write).toHaveBeenCalledWith(
        new TextEncoder().encode("hello"),
      );
    });

    it("should write Uint8Array message", async () => {
      const port = new Port({}, {});
      const data = new Uint8Array([1, 2, 3]);
      await port.connectTo(mockPort);
      await port.write(data);
      expect(mockWriter.write).toHaveBeenCalledWith(data);
    });

    it("should call onError on write error", async () => {
      const onError = vi.fn();
      const port = new Port({}, { onError });
      mockWriter.write.mockRejectedValue(new Error("write error"));
      await port.connectTo(mockPort);
      await port.write("hello");
      expect(onError).toHaveBeenCalledWith(new Error("write error"));
    });

    it("should do nothing if no port or not writable", async () => {
      const port = new Port({}, {});
      await port.write("hello");
      expect(mockWriter.write).not.toHaveBeenCalled();
    });
  });
});
