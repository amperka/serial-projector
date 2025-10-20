import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveState, loadState } from "../src/storage.js";

describe("storage.js", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  describe("saveState", () => {
    it("should save string keys to localStorage", () => {
      const state = {
        bgColor: "#ffffff",
        textColor: "#000000",
        fontFamily: "Arial",
        parity: "none",
      };
      saveState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "state_bgColor",
        "#ffffff",
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "state_textColor",
        "#000000",
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "state_fontFamily",
        "Arial",
      );
      expect(localStorage.setItem).toHaveBeenCalledWith("state_parity", "none");
    });

    it("should save number keys to localStorage", () => {
      const state = {
        fontSize: 16,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
      };
      saveState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith("state_fontSize", 16);
      expect(localStorage.setItem).toHaveBeenCalledWith("state_baudRate", 9600);
      expect(localStorage.setItem).toHaveBeenCalledWith("state_dataBits", 8);
      expect(localStorage.setItem).toHaveBeenCalledWith("state_stopBits", 1);
    });

    it("should save object keys as JSON to localStorage", () => {
      const state = {
        lastPortInfo: { vendorId: "1234", productId: "5678" },
      };
      saveState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "state_lastPortInfo",
        JSON.stringify({ vendorId: "1234", productId: "5678" }),
      );
    });

    it("should ignore non-persisted keys", () => {
      const state = {
        bgColor: "#ffffff",
        nonPersistedKey: "ignore me",
      };
      saveState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "state_bgColor",
        "#ffffff",
      );
      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        "state_nonPersistedKey",
        "ignore me",
      );
    });
  });

  describe("loadState", () => {
    it("should load string keys from localStorage", () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === "state_bgColor") return "#ffffff";
        if (key === "state_textColor") return "#000000";
        if (key === "state_fontFamily") return "Arial";
        if (key === "state_parity") return "none";
        return null;
      });
      const result = loadState();
      expect(result).toEqual({
        bgColor: "#ffffff",
        textColor: "#000000",
        fontFamily: "Arial",
        parity: "none",
      });
    });

    it("should load number keys from localStorage", () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === "state_fontSize") return "16";
        if (key === "state_baudRate") return "9600";
        if (key === "state_dataBits") return "8";
        if (key === "state_stopBits") return "1";
        return null;
      });
      const result = loadState();
      expect(result).toEqual({
        fontSize: 16,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
      });
    });

    it("should load object keys from localStorage", () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === "state_lastPortInfo")
          return JSON.stringify({ vendorId: "1234", productId: "5678" });
        return null;
      });
      const result = loadState();
      expect(result).toEqual({
        lastPortInfo: { vendorId: "1234", productId: "5678" },
      });
    });

    it("should return empty object if no keys are set", () => {
      localStorage.getItem.mockReturnValue(null);
      const result = loadState();
      expect(result).toEqual({});
    });

    it("should skip keys that are not set", () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === "state_bgColor") return "#ffffff";
        return null;
      });
      const result = loadState();
      expect(result).toEqual({
        bgColor: "#ffffff",
      });
    });

    it("should handle invalid JSON for object keys gracefully", () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === "state_lastPortInfo") return "invalid json";
        return null;
      });
      // Note: In reality, JSON.parse would throw, but since the code does JSON.parse(value || "{}"), it will parse "{}"
      const result = loadState();
      expect(result).toEqual({
        lastPortInfo: {},
      });
    });
  });
});
