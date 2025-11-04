import { describe, it, expect } from "vitest";
import { isEspruino } from "../src/board.js";

describe("board.js", () => {
  describe("isEspruino", () => {
    describe("positive cases", () => {
      it("should return true for first Espruino ID (stm32legacyusb)", () => {
        const info = {
          usbVendorId: 0x0483,
          usbProductId: 0x5740,
        };
        expect(isEspruino(info)).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false when vendorId or productId doesn't match", () => {
        const info = {
          usbVendorId: -1,
          usbProductId: -1,
        };
        expect(isEspruino(info)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should return false when info is undefined", () => {
        expect(isEspruino(undefined)).toBe(false);
      });

      it("should return false when info is an empty object", () => {
        expect(isEspruino({})).toBe(false);
      });

      it("should return false when info is missing usbVendorId", () => {
        const info = {
          usbProductId: 0x5740,
        };
        expect(isEspruino(info)).toBe(false);
      });

      it("should return false when info is missing usbProductId", () => {
        const info = {
          usbVendorId: 0x0483,
        };
        expect(isEspruino(info)).toBe(false);
      });
    });
  });
});
