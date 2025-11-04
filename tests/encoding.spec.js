import { describe, it, expect } from "vitest";
import { decodeEspruinoMixedEncoding, mkDecoder } from "../src/encoding.js";

describe("decodeEspruinoMixedEncoding", () => {
  describe("pure UTF-8 strings", () => {
    it("should decode pure ASCII text", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Hello");
    });
    it("should decode pure UTF-8 with 2-byte sequences", () => {
      // "café" - é is 2-byte UTF-8 sequence
      const bytes = new Uint8Array([99, 97, 102, 195, 169]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("café");
    });
    it("should decode pure UTF-8 with 3-byte sequences", () => {
      // "€" - Euro symbol is 3-byte UTF-8 sequence
      const bytes = new Uint8Array([226, 130, 172]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("€");
    });
    it("should decode pure UTF-8 with 4-byte sequences", () => {
      // "👍" - Thumbs up emoji is 4-byte UTF-8 sequence
      const bytes = new Uint8Array([240, 159, 145, 141]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("👍");
    });
    it("should decode mixed length UTF-8 sequences", () => {
      // "Héllo 👍" - mix of ASCII, 2-byte, and 4-byte sequences
      const bytes = new Uint8Array([
        72, 195, 169, 108, 108, 111, 32, 240, 159, 145, 141,
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Héllo 👍");
    });
  });
  describe("mixed encoding scenarios", () => {
    it("should handle mixed UTF-8 and ISO-8859-1 bytes", () => {
      // "Hé" (UTF-8) + "°" (ISO-8859-1 byte 0xB0) + "llo"
      const bytes = new Uint8Array([72, 195, 169, 176, 108, 108, 111]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Hé°llo");
    });
    it("should handle ISO-8859-1 bytes in UTF-8 range", () => {
      // "Test" + 0xB0 + "more" where 0xB0 should be interpreted as ISO-8859-1
      const bytes = new Uint8Array([
        84, 101, 115, 116, 176, 109, 111, 114, 101,
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Test°more");
    });
    it("should handle multiple ISO-8859-1 bytes", () => {
      // "°±²³" - all ISO-8859-1 bytes
      const bytes = new Uint8Array([176, 177, 178, 179]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("°±²³");
    });
    it("should handle alternating UTF-8 and ISO-8859-1", () => {
      // "A" (ASCII) + "é" (UTF-8) + "°" (ISO-8859-1) + "B" (ASCII)
      const bytes = new Uint8Array([65, 195, 169, 176, 66]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Aé°B");
    });
    it("should handle different length UTF-8 and ISO-8859-1", () => {
      const bytes = new Uint8Array([
        0xb0, // "°" (ISO-8859-1)
        0x41, // "A" UTF-8/ASCI, 1 byte
        0xc2, // "®" UTF-8, 2 bytes
        0xae,
        0xe2, // "≥" UTF-8, 3 bytes
        0x89,
        0xa5,
        0xf0, // "😄" UTF-8, 4 bytes
        0x9f,
        0x98,
        0x84,
        0xb0, // "°" (ISO-8859-1)
        0xb0, // "°" (ISO-8859-1)
        0xf0, // "😄" UTF-8, 4 bytes
        0x9f,
        0x98,
        0x84,
        0xe2, // "≥" UTF-8, 3 bytes
        0x89,
        0xa5,
        0xc2, // "®" UTF-8, 2 bytes
        0xae,
        0x41, // "A" UTF-8/ASCI, 1 byte
        0xb0, // "°" (ISO-8859-1)
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("°A®≥😄°°😄≥®A°");
    });
  });
  describe("edge cases", () => {
    it("should handle empty array", () => {
      const bytes = new Uint8Array([]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("");
    });
    it("should handle single ASCII byte", () => {
      const bytes = new Uint8Array([65]); // "A"
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("A");
    });
    it("should handle single ISO-8859-1 byte", () => {
      const bytes = new Uint8Array([176]); // "°"
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("°");
    });
    it("should handle single UTF-8 start byte", () => {
      const bytes = new Uint8Array([195]); // Incomplete 2-byte sequence
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Ã"); // Should fallback to ISO-8859-1
    });
  });
  describe("invalid UTF-8 sequences", () => {
    it("should handle invalid UTF-8 start bytes", () => {
      // 0xF5-0xFF are invalid UTF-8 start bytes
      const bytes = new Uint8Array([
        245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("õö÷øùúûüýþÿ");
    });
    it("should handle invalid secondary bytes", () => {
      // Secondary bytes should be 0x80-0xBF, so 0xC0-0xFF are invalid
      const bytes = new Uint8Array([195, 192, 193, 194]); // 0xC0, 0xC1, 0xC2 are invalid secondary bytes
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("ÃÀÁÂ");
    });
    it("should handle overlong UTF-8 sequences", () => {
      // Overlong encoding for ASCII character 'A' (should be 1 byte, but encoded as 2)
      const bytes = new Uint8Array([194, 65]); // Invalid overlong encoding
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("ÂA");
    });
    it("should reject overlong 3-byte UTF-8 encoding for 2-byte range", () => {
      // Overlong encoding: U+007F (should be 1 byte, but encoded as 3)
      // Valid UTF-8 would be [0x7F], overlong 3-byte is [0xE0, 0x9F, 0xBF]
      const bytes = new Uint8Array([224, 159, 191]); // U+07FF encoded as 3 bytes (overlong)
      const result = decodeEspruinoMixedEncoding(bytes);
      // Should treat as separate ISO-8859-1 bytes since it's overlong
      expect(result).toBe(String.fromCodePoint(224, 159, 191));
    });
    it("should reject overlong 3-byte UTF-8 encoding for 2-byte range (U+007F)", () => {
      // U+007F encoded as 3-byte sequence (overlong)
      // Binary: 0x7F = 0b1111111, should be 1-byte, but encoded as 3-byte
      const bytes = new Uint8Array([224, 0x9f, 0xbf]); // Overlong encoding of U+007F
      const result = decodeEspruinoMixedEncoding(bytes);
      // Should fallback to treating as separate bytes
      expect(result).toBe(String.fromCodePoint(224, 0x9f, 0xbf));
    });
    it("should reject overlong 3-byte UTF-8 encoding for 2-byte range (U+00FF)", () => {
      // U+00FF encoded as 3-byte sequence (overlong)
      // U+00FF should be 2-byte [0xC3, 0xBF], but encoded as 3-byte
      // Overlong encoding: 1110xxxx 10xxxxxx 10xxxxxx for U+00FF (255)
      // U+00FF = 0x00FF, for 3-byte overlong: 0xE0 0x80 0xBF
      const bytes = new Uint8Array([224, 128, 191]); // Overlong encoding of U+00FF
      const result = decodeEspruinoMixedEncoding(bytes);
      // Since codePoint = 255 < 0x800, it should be rejected as overlong
      // The function will treat each byte as separate ISO-8859-1 characters
      expect(result).toBe(String.fromCodePoint(224, 128, 191));
    });
    it("should handle surrogate half in UTF-8", () => {
      // High surrogate U+D800 should not appear in UTF-8
      const bytes = new Uint8Array([237, 160, 128]); // Overlong encoding of U+D800
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(237, 160, 128));
    });
  });
  describe("boundary conditions", () => {
    it("should handle minimum valid 2-byte UTF-8 sequence", () => {
      // U+0080 - minimum 2-byte sequence
      const bytes = new Uint8Array([194, 128]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(0x0080));
    });
    it("should handle maximum valid 2-byte UTF-8 sequence", () => {
      // U+07FF (ƿ)
      const bytes = new Uint8Array([223, 191]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("߿");
    });
    it("should handle minimum valid 3-byte UTF-8 sequence", () => {
      // U+0800 (ࠀ)
      const bytes = new Uint8Array([0xe0, 0xa0, 0x80]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("ࠀ");
    });
    it("should handle valid 3-byte UTF-8 sequence just above minimum", () => {
      // U+0801 (just above minimum 3-byte range)
      const bytes = new Uint8Array([224, 160, 129]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(0x0801));
    });
    it("should handle valid 3-byte UTF-8 sequence in middle range", () => {
      // U+0FFF (middle of 3-byte range)
      // U+0FFF = 4095 decimal = 0x0FFF hex
      // Correct 3-byte UTF-8 encoding: 1110xxxx 10xxxxxx 10xxxxxx
      // xxxx xxxx xxxx = 0000 1111 1111 1111
      // First byte: 1110 + first 4 bits (0000) = 1110 0000 = 0xE0
      // Second byte: 10 + next 6 bits (111111) = 1011 1111 = 0xBF
      // Third byte: 10 + last 6 bits (111111) = 1011 1111 = 0xBF
      const bytes = new Uint8Array([224, 191, 191]); // Correct encoding of U+0FFF
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(0x0fff));
    });
    it("should handle valid 3-byte sequence just below surrogate range", () => {
      // U+D7FF (just before surrogate range U+D800-U+DFFF)
      // U+D7FF = 55295 decimal = 0xD7FF hex
      // 3-byte UTF-8 encoding: 1110xxxx 10xxxxxx 10xxxxxx
      // xxxx xxxx xxxx = 1101 0111 1111 1111
      // First byte: 1110 + first 4 bits (1101) = 1110 1101 = 0xED
      // Second byte: 10 + next 6 bits (011111) = 1001 1111 = 0x9F
      // Third byte: 10 + last 6 bits (111111) = 1011 1111 = 0xBF
      const bytes = new Uint8Array([0xb0, 0xed, 0x9f, 0xbf]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(0xb0, 0xd7ff));
    });
    it("should reject 3-byte UTF-8 sequence in surrogate range", () => {
      // U+D800 (high surrogate - should not appear in UTF-8)
      const bytes = new Uint8Array([237, 160, 128]);
      const result = decodeEspruinoMixedEncoding(bytes);
      // Should treat as separate bytes since it's in surrogate range
      expect(result).toBe(String.fromCodePoint(237, 160, 128));
    });
    it("should reject 3-byte UTF-8 sequence in surrogate range (low surrogate)", () => {
      // U+DFFF (low surrogate - should not appear in UTF-8)
      const bytes = new Uint8Array([237, 191, 159]);
      const result = decodeEspruinoMixedEncoding(bytes);
      // Should treat as separate bytes since it's in surrogate range
      expect(result).toBe(String.fromCodePoint(237, 191, 159));
    });
    it("should handle maximum valid 3-byte UTF-8 sequence", () => {
      // U+FFFF (maximum 3-byte sequence)
      const bytes = new Uint8Array([176, 239, 191, 191]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe(String.fromCodePoint(176, 0xffff));
    });
    it("should handle minimum valid 4-byte UTF-8 sequence", () => {
      // U+10000 (𐀀)
      const bytes = new Uint8Array([240, 144, 128, 128]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("𐀀");
    });
    it("should handle maximum valid 4-byte UTF-8 sequence", () => {
      // U+10FFFD (near maximum Unicode code point)
      const bytes = new Uint8Array([243, 191, 191, 189]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("󿿽");
    });
  });
  describe("real-world Espruino scenarios", () => {
    it("should handle typical Espruino mixed output", () => {
      // Simulating typical output from Espruino boards with mixed content
      const bytes = new Uint8Array([
        86, 97, 108, 117, 101, 32, 61, 32, 49, 50, 51, 46, 52, 53, 176, 67, 10,
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Value = 123.45°C\n");
    });
    it("should handle mixed UTF-8 and Windows-1252 characters", () => {
      // Windows-1252 characters that are common in embedded systems
      const bytes = new Uint8Array([
        84, 101, 109, 112, 101, 114, 97, 116, 117, 114, 101, 58, 32, 50, 51, 46,
        49, 176, 67, 32, 194, 177, 67, 10,
      ]);
      const result = decodeEspruinoMixedEncoding(bytes);
      expect(result).toBe("Temperature: 23.1°C ±C\n");
    });
  });
});

describe("mkDecoder", () => {
  it("should create decoder with default encoding", () => {
    const decoder = mkDecoder();
    expect(decoder).toHaveProperty("encoding", "default");
    expect(decoder).toHaveProperty("decode");
    expect(typeof decoder.decode).toBe("function");
  });
  it("should create decoder with other valid encodings", () => {
    const encodings = ["utf-8", "ascii", "utf-16le", "utf-16be"];
    encodings.forEach((encoding) => {
      const decoder = mkDecoder(encoding);
      expect(decoder).toHaveProperty("encoding", encoding);
      expect(decoder).toHaveProperty("decode");
      expect(typeof decoder.decode).toBe("function");
    });
  });
  describe("decoder functionality", () => {
    it("should decode mixed encoding with Espruino decoder", () => {
      const decoder = mkDecoder("x-espruino-mixed-utf8");
      const bytes = new Uint8Array([72, 195, 169, 176, 108, 108, 111]); // "Hé°llo"
      const result = decoder.decode(bytes);
      expect(result).toBe("Hé°llo");
    });
  });
});
