/**
 * Array of (usbVendorId, usbProductId)
 */
const ESPRUINO_IDS = [
  [0x0483, 0x5740], // stm32legacyusb
  [1155, 22336], // stm32usb
];

/**
 * Detect Espruino-like
 * @param {SerialPortInfo} info
 * @returns {boolean}
 */
export function isEspruino(info) {
  if (!info) return false;
  return ESPRUINO_IDS.some(
    ([vendorId, productId]) =>
      info.usbVendorId === vendorId && info.usbProductId === productId,
  );
}
