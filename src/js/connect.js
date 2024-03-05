async function requestDevice() {
  try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      console.log(device);
  } catch (e) {
      console.error(e);
  }
}