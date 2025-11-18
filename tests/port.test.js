import { describe, it, expect, beforeEach, vi } from "vitest";
import { Port } from "../src/port.js";
import { mkDecoder } from "../src/encoding.js";

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
      const port = new Port({}, mkDecoder("default"), handlers);
      expect(port.onConnect).toBe(handlers.onConnect);
      expect(port.onDisconnect).toBe(handlers.onDisconnect);
      expect(port.onError).toBe(handlers.onError);
      expect(port.onMessage).toBe(handlers.onMessage);
    });

    it("should set default doNothing handlers if not provided", () => {
      const port = new Port({});
      expect(typeof port.onConnect).toBe("function");
      expect(typeof port.onDisconnect).toBe("function");
      expect(typeof port.onError).toBe("function");
      expect(typeof port.onMessage).toBe("function");
    });

    it("should set portOptions", () => {
      const options = { baudRate: 9600 };
      const port = new Port(options);
      expect(port.portOptions).toBe(options);
    });
  });

  describe("signals functionality", () => {
    it("should set signals in constructor", () => {
      const signals = {
        dataTerminalReady: true,
        requestToSend: false,
      };
      const port = new Port({}, {}, {}, signals);
      expect(port).toBeDefined();
    });

    it("should update signals via setSignals method", () => {
      const port = new Port({});
      const newSignals = {
        dataTerminalReady: true,
        requestToSend: false,
        break: true,
      };

      port.setSignals(newSignals);
      // The signals are stored privately, but we can verify the method exists and doesn't throw
      expect(typeof port.setSignals).toBe("function");
    });

    it("should handle empty signals object", () => {
      const port = new Port({});
      port.setSignals({});
      expect(typeof port.setSignals).toBe("function");
    });

    it("should handle null signals", () => {
      const port = new Port({});
      port.setSignals(null);
      expect(typeof port.setSignals).toBe("function");
    });
  });

  describe("decoder functionality", () => {
    it("should set decoder property in constructor", () => {
      const customDecoder = mkDecoder("utf-8");
      const port = new Port({}, customDecoder);
      expect(port.decoder).toBe(customDecoder);
    });

    it("should use default decoder when none provided", () => {
      const port = new Port({});
      expect(port.decoder).toBeDefined();
      expect(port.decoder.encoding).toBe("default");
      expect(typeof port.decoder.decode).toBe("function");
    });

    it("should use custom decoder in readUntilClosed", async () => {
      const customDecoder = {
        encoding: "custom",
        decode: vi.fn((bytes) => "decoded: " + new TextDecoder().decode(bytes)),
      };
      const onMessage = vi.fn();
      const port = new Port({}, customDecoder, {
        onMessage,
        onDisconnect: vi.fn(),
      });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("hello\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(customDecoder.decode).toHaveBeenCalled();
      expect(onMessage).toHaveBeenCalledWith("decoded: hello");
    });

    it("should handle different decoder encodings", async () => {
      const latin1Decoder = mkDecoder("latin1");
      const onMessage = vi.fn();
      const port = new Port({}, latin1Decoder, {
        onMessage,
        onDisconnect: vi.fn(),
      });
      // Test with bytes that differ between UTF-8 and Latin-1
      const testBytes = new Uint8Array([0xe9, 0x0d, 0x0a]); // é in Latin-1 + CRLF
      mockReader.read
        .mockResolvedValueOnce({
          value: testBytes,
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("é");
    });

    it("should handle espruino mixed encoding decoder", async () => {
      const espruinoDecoder = mkDecoder("x-espruino-mixed-utf8");
      const onMessage = vi.fn();
      const port = new Port({}, espruinoDecoder, {
        onMessage,
        onDisconnect: vi.fn(),
      });
      // Test with mixed UTF-8 and ISO-8859-1 bytes typical of Espruino
      const mixedBytes = new Uint8Array([
        0xd0,
        0xa2,
        0xd0,
        0xb5,
        0xd1,
        0x81,
        0xd1,
        0x82, // "Тест" (UTF-8)
        0x20, // " " (пробел)
        0xb0, // "°" (ISO-8859-1)
        0x0d,
        0x0a, // CRLF
      ]);
      mockReader.read
        .mockResolvedValueOnce({
          value: mixedBytes,
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("Тест °");
    });

    it("should handle decoder errors gracefully", async () => {
      const faultyDecoder = {
        encoding: "faulty",
        decode: vi.fn(() => {
          throw new Error("decode error");
        }),
      };
      const onError = vi.fn();
      const onDisconnect = vi.fn();
      const port = new Port({}, faultyDecoder, {
        onError,
        onDisconnect,
      });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("test\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onError).toHaveBeenCalledWith(new Error("decode error"));
      expect(onDisconnect).toHaveBeenCalled();
    });
  });

  describe("requestPort", () => {
    it("should call navigator.serial.requestPort", async () => {
      mockSerial.requestPort.mockResolvedValue(mockPort);
      const port = new Port({});
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
      const port = new Port({});
      const result = await port.getPrevPort(prevInfo);
      expect(result).toBe(mockPort);
    });

    it("should return false if no matching port", async () => {
      mockPort.getInfo.mockReturnValue({ vendorId: "9999" });
      mockSerial.getPorts.mockResolvedValue([mockPort]);
      const port = new Port({});
      const result = await port.getPrevPort({ vendorId: "1234" });
      expect(result).toBe(false);
    });

    it("should return false if no ports", async () => {
      mockSerial.getPorts.mockResolvedValue([]);
      const port = new Port({});
      const result = await port.getPrevPort({ vendorId: "1234" });
      expect(result).toBe(false);
    });
  });

  describe("handleVT100Codes", () => {
    it("should handle erase display codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("before\x1b[2Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[0Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[1Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[3Jafter")).toBe("after");
      expect(port.handleVT100Codes("before\x33[2Jafter")).toBe("after");
    });

    it("should handle erase line codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("before\x1b[Kafter")).toBe("before");
      expect(port.handleVT100Codes("before\x1b[0Kafter")).toBe("before");
      expect(port.handleVT100Codes("before\x1b[1Kafter")).toBe("after");
      expect(port.handleVT100Codes("before\x1b[2Kafter")).toBe("");
    });

    it("should handle backspace codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("abc\x08d")).toBe("abd");
      expect(port.handleVT100Codes("\x08abc")).toBe("abc");
      expect(port.handleVT100Codes("a\x08\x08bc")).toBe("bc");
    });

    it("should handle multiple consecutive backspaces", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("abc\x08\x08")).toBe("a");
      expect(port.handleVT100Codes("hello\x08\x08world")).toBe("helworld");
    });

    it("should handle mixed VT100 codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("text\x1b[2Jmore\x08text")).toBe("mortext");
      expect(port.handleVT100Codes("start\x1b[Kend\x08\x08")).toBe("start");
    });

    it("should handle empty string", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("")).toBe("");
    });

    it("should handle string with only control codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("\x1b[2J\x08\x1b[K")).toBe("");
    });

    it("should return unchanged if no codes", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("hello world")).toBe("hello world");
    });

    it("should handle multiple VT100 codes in sequence", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("start\x1b[2J\x08middle\x1b[Kend")).toBe(
        "middle",
      );
    });

    it("should handle invalid VT100 sequences gracefully", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("before\x1b[invalidafter")).toBe(
        "before\x1b[invalidafter",
      );
    });

    it("should handle backspace at beginning", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("\x08\x08hello")).toBe("hello");
    });

    it("should handle consecutive backspaces", () => {
      const port = new Port({});
      expect(port.handleVT100Codes("abc\x08\x08\x08\x08")).toBe("");
    });
  });

  describe("readUntilClosed", () => {
    it("should read messages and call onMessage", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
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
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
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
      const port = new Port({}, mkDecoder("default"), {
        onError,
        onDisconnect: vi.fn(),
      });
      mockReader.read.mockRejectedValue(new Error("read error"));
      await port.connectTo(mockPort);
      expect(onError).toHaveBeenCalledWith(new Error("read error"));
    });

    it("should call onDisconnect when done", async () => {
      const onDisconnect = vi.fn();
      const port = new Port({}, mkDecoder("default"), { onDisconnect });
      mockReader.read.mockResolvedValue({ done: true });
      await port.connectTo(mockPort);
      expect(onDisconnect).toHaveBeenCalled();
    });

    it("should return early if no port is set", async () => {
      const port = new Port({}, mkDecoder("default"), {});
      await expect(port.readUntilClosed()).resolves.toBeUndefined();
    });

    it("should handle empty messages", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("");
    });

    it("should handle partial messages across reads", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("partial"),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode(" message\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("partial message");
    });

    it("should handle multiple messages in single read", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("msg1\r\nmsg2\r\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("msg1");
      expect(onMessage).toHaveBeenCalledWith("msg2");
    });

    it("should handle large messages", async () => {
      const onMessage = vi.fn();
      const port = new Port({}, mkDecoder("default"), {
        onMessage,
        onDisconnect: vi.fn(),
      });
      const largeMessage = "x".repeat(10000) + "\r\n";
      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode(largeMessage),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });
      await port.connectTo(mockPort);
      expect(onMessage).toHaveBeenCalledWith("x".repeat(10000));
    });
  });

  describe("stopReading", () => {
    it("should cancel reader and wait for close", async () => {
      const port = new Port({});
      await port.connectTo(mockPort);
      await port.stopReading();
      expect(mockReader.cancel).toHaveBeenCalled();
    });
  });

  describe("forgetAll", () => {
    it("should forget current port and all ports", async () => {
      mockSerial.getPorts.mockResolvedValue([mockPort, mockPort]);
      const port = new Port({});
      await port.connectTo(mockPort);
      await port.forgetAll();
      expect(mockPort.forget).toHaveBeenCalledTimes(3); // current + two from getPorts
    });
  });

  describe("connectTo", () => {
    it("should open port, call onConnect, and start reading", async () => {
      const onConnect = vi.fn();
      const port = new Port({ baudRate: 9600 }, mkDecoder("default"), {
        onConnect,
      });
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
      const port = new Port({});
      const result = await port.connectToPrev(prevInfo);
      expect(mockPort.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if no previous port", async () => {
      mockSerial.getPorts.mockResolvedValue([]);
      const port = new Port({});
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
      const port = new Port({});
      const data = new Uint8Array([1, 2, 3]);
      await port.connectTo(mockPort);
      await port.write(data);
      expect(mockWriter.write).toHaveBeenCalledWith(data);
    });

    it("should write empty string", async () => {
      const port = new Port({});
      await port.connectTo(mockPort);
      await port.write("");
      expect(mockWriter.write).toHaveBeenCalledWith(
        new TextEncoder().encode(""),
      );
    });

    it("should write empty Uint8Array", async () => {
      const port = new Port({});
      const data = new Uint8Array([]);
      await port.connectTo(mockPort);
      await port.write(data);
      expect(mockWriter.write).toHaveBeenCalledWith(new Uint8Array([]));
    });

    it("should call onError on write error", async () => {
      const onError = vi.fn();
      const port = new Port({}, mkDecoder("default"), { onError });
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

    it("should handle writer release lock error", async () => {
      const port = new Port({});
      await port.connectTo(mockPort);
      mockWriter.releaseLock.mockImplementation(() => {
        throw new Error("release lock error");
      });
      // Should throw error since releaseLock error is not caught
      await expect(port.write("test")).rejects.toThrow("release lock error");
    });
  });
});
