/**
 * Decodes a Uint8Array that contains a "mix" of UTF-8 and
 * single-byte characters (ISO-8859-1/Windows-1252)
 * typical to Espruino/IskraJS boards.
 *
 * This function trues to use standard TextDecoder and fix only
 * not decoded characters.
 *
 * @param {Uint8Array<ArrayBuffer>} bytes Input array of bytes
 * @returns {string} Correctly encoded string
 */
export function decodeEspruinoMixedEncoding(bytes) {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const utf8Text = decoder.decode(bytes);

  // If text not includes "�" (replacement character), then done
  if (!utf8Text.includes("\uFFFD")) return utf8Text;

  let result = "";
  let byteIndex = 0;

  for (const ch of utf8Text) {
    if (ch !== "\uFFFD") {
      // skip UTF-8 symbol's bytes
      const b = bytes[byteIndex];
      let advance = 1;
      // First bytes indicates the length of the UTF-8 symbol:
      //  - 00–7F => 1 byte
      //  - C2–DF => 2 bytes
      //  - E0–EF => 3 bytes
      //  - F0–F4 => 4 bytes
      if (b >= 0xc2 && b <= 0xdf) advance = 2;
      else if (b >= 0xe0 && b <= 0xef) advance = 3;
      else if (b >= 0xf0 && b <= 0xf4) advance = 4;
      result += ch;
      byteIndex += advance;
    } else {
      // fallback to Latin-1
      const b = bytes[byteIndex];
      result += String.fromCharCode(b);
      byteIndex += 1;
    }
  }

  return result;
}

/**
 * @typedef {object} SerialPortTextDecoder
 * @property {string} encoding
 * @property {(bytes: Uint8Array) => string} decode
 */

/**
 * Create bytes to text decoder with specified encoding
 * @param {string} [encoding]
 * @returns {SerialPortTextDecoder}
 */
export function mkDecoder(encoding = "default") {
  if (encoding === "x-espruino-mixed-utf8") {
    return { encoding, decode: decodeEspruinoMixedEncoding };
  }
  return {
    encoding,
    decode: (bytes) =>
      new TextDecoder(encoding === "default" ? "utf-8" : encoding, {
        fatal: false,
      }).decode(bytes),
  };
}
