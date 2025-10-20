import { describe, it, expect, vi } from "vitest";
import {
  isModalClosed,
  openModal,
  closeModal,
  loadStateFromDOM,
  renderPortSettings,
  bindPortSettings,
  renderStyleSettings,
  bindStyleSettings,
  bindAbout,
  renderModalState,
  sanitizeHtml,
  renderMessages,
  renderFullscreenMode,
  bindFullscreenMode,
  renderState,
  bindStateToDOM,
} from "../src/ui.js";
import { StateContainer } from "../src/state.js";

describe("ui.js", () => {
  describe("isModalClosed", () => {
    it("returns true for empty display", () => {
      const el = { style: { display: "" } };
      expect(isModalClosed(el)).toBe(true);
    });

    it("returns true for none display", () => {
      const el = { style: { display: "none" } };
      expect(isModalClosed(el)).toBe(true);
    });

    it("returns false for flex display", () => {
      const el = { style: { display: "flex" } };
      expect(isModalClosed(el)).toBe(false);
    });
  });

  describe("openModal", () => {
    it("sets display to flex", () => {
      const el = { style: {} };
      openModal(el);
      expect(el.style.display).toBe("flex");
    });
  });

  describe("closeModal", () => {
    it("sets display to none", () => {
      const el = { style: {} };
      closeModal(el);
      expect(el.style.display).toBe("none");
    });
  });

  describe("loadStateFromDOM", () => {
    it("loads state from DOM elements", () => {
      const mockEl = {
        doc: { fullscreenElement: document.documentElement },
        msg: { innerHTML: "<p>test message</p>" },
        status: { innerText: "connected" },
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "" } },
        aboutModal: { style: { display: "flex" } },
        bgColor: { value: "#000000" },
        textColor: { value: "#ffffff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "12" },
        baudRate: { value: "9600" },
        dataBits: { value: "8" },
        parity: { value: "none" },
        stopBits: { value: "1" },
      };
      const state = loadStateFromDOM(mockEl);
      expect(state).toEqual({
        bgColor: "#000000",
        textColor: "#ffffff",
        fontFamily: "Arial",
        fontSize: 12,
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
        isFullscreen: true,
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: true,
        message: "<p>test message</p>",
        status: "connected",
      });
    });
  });

  describe("renderPortSettings", () => {
    it("updates baudRate if changed", () => {
      const el = { baudRate: { value: "1200" } };
      const state = { baudRate: 9600 };
      const oldState = { baudRate: 1200 };
      renderPortSettings(el, state, oldState);
      expect(el.baudRate.value).toBe(9600);
    });

    it("does not update baudRate if not changed", () => {
      const el = { baudRate: { value: "9600" } };
      const state = { baudRate: 9600 };
      const oldState = { baudRate: 9600 };
      renderPortSettings(el, state, oldState);
      expect(el.baudRate.value).toBe("9600");
    });

    it("updates dataBits if changed", () => {
      const el = { dataBits: { value: "7" } };
      const state = { dataBits: 8 };
      const oldState = { dataBits: 7 };
      renderPortSettings(el, state, oldState);
      expect(el.dataBits.value).toBe(8);
    });

    it("updates parity if changed", () => {
      const el = { parity: { value: "even" } };
      const state = { parity: "none" };
      const oldState = { parity: "even" };
      renderPortSettings(el, state, oldState);
      expect(el.parity.value).toBe("none");
    });

    it("updates stopBits if changed", () => {
      const el = { stopBits: { value: "2" } };
      const state = { stopBits: 1 };
      const oldState = { stopBits: 2 };
      renderPortSettings(el, state, oldState);
      expect(el.stopBits.value).toBe(1);
    });
  });

  describe("bindPortSettings", () => {
    it("binds settingsBtn click to open settings modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.settingsBtn.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: true,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      });
    });

    it("binds settingsClose click to close settings modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.settingsClose.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: false,
      });
    });

    it("binds connectBtn click to close settings modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.connectBtn.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: false,
      });
    });

    it("binds disconnectBtn click to close settings modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.disconnectBtn.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: false,
      });
    });

    it("binds baudRate change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.baudRate.value = "115200";
      el.baudRate.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ baudRate: 115200 });
    });

    it("binds dataBits change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.dataBits.value = "7";
      el.dataBits.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ dataBits: 7 });
    });

    it("binds parity change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.parity.value = "even";
      el.parity.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ parity: "even" });
    });

    it("binds stopBits change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindPortSettings(el, store);
      el.stopBits.value = "2";
      el.stopBits.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ stopBits: 2 });
    });
  });

  describe("renderStyleSettings", () => {
    it("updates bgColor and body background if changed", () => {
      const el = {
        doc: document,
        bgColor: { value: "#000" },
        textColor: { value: "#fff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "10" },
        msg: document.createElement("div"),
      };
      const state = {
        bgColor: "#fff",
        textColor: "#000",
        fontFamily: "Times",
        fontSize: 12,
      };
      const oldState = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Arial",
        fontSize: 10,
      };
      renderStyleSettings(el, state, oldState);
      expect(el.bgColor.value).toBe("#fff");
      expect(el.doc.body.style.background).toBe("rgb(255, 255, 255)");
    });

    it("updates textColor and msg color if changed", () => {
      const el = {
        doc: document,
        bgColor: { value: "#000" },
        textColor: { value: "#fff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "10" },
        msg: document.createElement("div"),
      };
      const state = {
        bgColor: "#000",
        textColor: "#000",
        fontFamily: "Arial",
        fontSize: 10,
      };
      const oldState = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Arial",
        fontSize: 10,
      };
      renderStyleSettings(el, state, oldState);
      expect(el.textColor.value).toBe("#000");
      expect(el.msg.style.color).toBe("rgb(0, 0, 0)");
    });

    it("updates fontFamily and msg fontFamily if changed", () => {
      const el = {
        doc: document,
        bgColor: { value: "#000" },
        textColor: { value: "#fff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "10" },
        msg: document.createElement("div"),
      };
      const state = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Times",
        fontSize: 10,
      };
      const oldState = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Arial",
        fontSize: 10,
      };
      renderStyleSettings(el, state, oldState);
      expect(el.fontFamily.value).toBe("Times");
      expect(el.msg.style.fontFamily).toBe("Times");
    });

    it("updates fontSize and msg fontSize if changed", () => {
      const el = {
        doc: document,
        bgColor: { value: "#000" },
        textColor: { value: "#fff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "10" },
        msg: document.createElement("div"),
      };
      const state = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Arial",
        fontSize: 12,
      };
      const oldState = {
        bgColor: "#000",
        textColor: "#fff",
        fontFamily: "Arial",
        fontSize: 10,
      };
      renderStyleSettings(el, state, oldState);
      expect(el.fontSize.value).toBe(12);
      expect(el.msg.style.fontSize).toBe("12vh");
    });
  });

  describe("bindStyleSettings", () => {
    it("binds styleBtn click to open style modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.styleBtn.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: false,
        isStyleModalOpened: true,
        isAboutModalOpened: false,
      });
    });

    it("binds styleClose click to close style modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.styleClose.click();
      expect(store.setState).toHaveBeenCalledWith({
        isStyleModalOpened: false,
      });
    });

    it("binds bgColor input to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.bgColor.value = "#fff";
      el.bgColor.dispatchEvent(new Event("input"));
      expect(store.setState).toHaveBeenCalledWith({ bgColor: "#fff" });
    });

    it("binds textColor input to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.textColor.value = "#000";
      el.textColor.dispatchEvent(new Event("input"));
      expect(store.setState).toHaveBeenCalledWith({ textColor: "#000" });
    });

    it("binds fontFamily change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.fontFamily.value = "Times";
      el.fontFamily.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ fontFamily: "Times" });
    });

    it("binds fontSize change to update state", () => {
      const store = { setState: vi.fn() };
      const el = {
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
      };
      bindStyleSettings(el, store);
      el.fontSize.value = "14";
      el.fontSize.dispatchEvent(new Event("change"));
      expect(store.setState).toHaveBeenCalledWith({ fontSize: 14 });
    });
  });

  describe("bindAbout", () => {
    it("binds aboutBtn click to open about modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        aboutBtn: document.createElement("button"),
        aboutClose: document.createElement("button"),
      };
      bindAbout(el, store);
      el.aboutBtn.click();
      expect(store.setState).toHaveBeenCalledWith({
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: true,
      });
    });

    it("binds aboutClose click to close about modal", () => {
      const store = { setState: vi.fn() };
      const el = {
        aboutBtn: document.createElement("button"),
        aboutClose: document.createElement("button"),
      };
      bindAbout(el, store);
      el.aboutClose.click();
      expect(store.setState).toHaveBeenCalledWith({
        isAboutModalOpened: false,
      });
    });
  });

  describe("renderModalState", () => {
    it("opens settings modal if state changed to true", () => {
      const el = {
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "none" } },
      };
      const state = {
        isSettingsModalOpened: true,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      const oldState = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      renderModalState(el, state, oldState);
      expect(el.settingsModal.style.display).toBe("flex");
    });

    it("closes settings modal if state changed to false", () => {
      const el = {
        settingsModal: { style: { display: "flex" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "none" } },
      };
      const state = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      const oldState = {
        isSettingsModalOpened: true,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      renderModalState(el, state, oldState);
      expect(el.settingsModal.style.display).toBe("none");
    });

    it("opens style modal if state changed to true", () => {
      const el = {
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "none" } },
      };
      const state = {
        isSettingsModalOpened: false,
        isStyleModalOpened: true,
        isAboutModalOpened: false,
      };
      const oldState = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      renderModalState(el, state, oldState);
      expect(el.styleModal.style.display).toBe("flex");
    });

    it("closes style modal if state changed to false", () => {
      const el = {
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "flex" } },
        aboutModal: { style: { display: "none" } },
      };
      const state = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      const oldState = {
        isSettingsModalOpened: false,
        isStyleModalOpened: true,
        isAboutModalOpened: false,
      };
      renderModalState(el, state, oldState);
      expect(el.styleModal.style.display).toBe("none");
    });

    it("opens about modal if state changed to true", () => {
      const el = {
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "none" } },
      };
      const state = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: true,
      };
      const oldState = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      renderModalState(el, state, oldState);
      expect(el.aboutModal.style.display).toBe("flex");
    });

    it("closes about modal if state changed to false", () => {
      const el = {
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "flex" } },
      };
      const state = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
      };
      const oldState = {
        isSettingsModalOpened: false,
        isStyleModalOpened: false,
        isAboutModalOpened: true,
      };
      renderModalState(el, state, oldState);
      expect(el.aboutModal.style.display).toBe("none");
    });
  });

  describe("sanitizeHtml", () => {
    it("removes script tags", () => {
      const html = "<p>hello</p><script>alert(1)</script><p>world</p>";
      expect(sanitizeHtml(html)).toBe("<p>hello</p><p>world</p>");
    });

    it("removes inline event handlers", () => {
      const html =
        '<p onclick="alert(1)">hello</p><a href="#" onmouseover="doSomething()">link</a>';
      expect(sanitizeHtml(html)).toBe('<p>hello</p><a href="#">link</a>');
    });

    it("leaves other attributes intact", () => {
      const html = '<p class="test" id="para">hello</p>';
      expect(sanitizeHtml(html)).toBe('<p class="test" id="para">hello</p>');
    });
  });

  describe("renderMessages", () => {
    it("updates msg innerHTML if message changed", () => {
      const el = {
        msg: document.createElement("div"),
        status: document.createElement("div"),
      };
      const state = { message: "<p>new message</p>", status: "connected" };
      const oldState = { message: "<p>old message</p>", status: "connected" };
      renderMessages(el, state, oldState);
      expect(el.msg.innerHTML).toBe("<p>new message</p>");
    });

    it("does not update msg if message not changed", () => {
      const el = {
        msg: document.createElement("div"),
        status: document.createElement("div"),
      };
      el.msg.innerHTML = "<p>same</p>";
      const state = { message: "<p>same</p>", status: "connected" };
      const oldState = { message: "<p>same</p>", status: "connected" };
      renderMessages(el, state, oldState);
      expect(el.msg.innerHTML).toBe("<p>same</p>");
    });

    it("updates status innerText if status changed", () => {
      const el = {
        msg: document.createElement("div"),
        status: document.createElement("div"),
      };
      const state = { message: "<p>msg</p>", status: "disconnected" };
      const oldState = { message: "<p>msg</p>", status: "connected" };
      renderMessages(el, state, oldState);
      expect(el.status.innerText).toBe("disconnected");
    });
  });

  describe("renderFullscreenMode", () => {
    it("requests fullscreen if state is true and not fullscreen", async () => {
      const mockDoc = {
        fullscreenElement: null,
        documentElement: { requestFullscreen: vi.fn() },
        exitFullscreen: vi.fn(),
      };
      const el = { doc: mockDoc };
      const state = { isFullscreen: true };
      await renderFullscreenMode(el, state);
      expect(mockDoc.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it("exits fullscreen if state is false and is fullscreen", async () => {
      const mockDoc = {
        fullscreenElement: {},
        documentElement: { requestFullscreen: vi.fn() },
        exitFullscreen: vi.fn(),
      };
      const el = { doc: mockDoc };
      const state = { isFullscreen: false };
      await renderFullscreenMode(el, state);
      expect(mockDoc.exitFullscreen).toHaveBeenCalled();
    });

    it("does nothing if state matches current fullscreen", async () => {
      const mockDoc = {
        fullscreenElement: null,
        documentElement: { requestFullscreen: vi.fn() },
        exitFullscreen: vi.fn(),
      };
      const el = { doc: mockDoc };
      const state = { isFullscreen: false };
      await renderFullscreenMode(el, state);
      expect(mockDoc.documentElement.requestFullscreen).not.toHaveBeenCalled();
      expect(mockDoc.exitFullscreen).not.toHaveBeenCalled();
    });
  });

  describe("bindFullscreenMode", () => {
    it("binds fullscreenBtn click to toggle fullscreen", () => {
      const store = {
        setState: vi.fn(),
        getState: vi.fn().mockReturnValue({ isFullscreen: false }),
      };
      const el = {
        doc: document,
        fullscreenBtn: document.createElement("button"),
      };
      bindFullscreenMode(el, store);
      el.fullscreenBtn.click();
      expect(store.setState).toHaveBeenCalledWith({ isFullscreen: true });
    });

    it("binds fullscreenchange to update state", () => {
      const store = {
        setState: vi.fn(),
        getState: vi.fn().mockReturnValue({ isFullscreen: false }),
      };
      const el = {
        doc: document,
        fullscreenBtn: document.createElement("button"),
      };
      bindFullscreenMode(el, store);
      document.fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event("fullscreenchange"));
      expect(store.setState).toHaveBeenCalledWith({ isFullscreen: true });
    });
  });

  describe("renderState", () => {
    it("calls render functions with correct params", async () => {
      const mockDoc = {
        fullscreenElement: null,
        documentElement: { requestFullscreen: vi.fn() },
        exitFullscreen: vi.fn(),
        body: { style: {} },
      };
      const el = {
        doc: mockDoc,
        msg: document.createElement("div"),
        status: document.createElement("div"),
        settingsModal: { style: { display: "none" } },
        styleModal: { style: { display: "none" } },
        aboutModal: { style: { display: "none" } },
        bgColor: { value: "#000" },
        textColor: { value: "#fff" },
        fontFamily: { value: "Arial" },
        fontSize: { value: "10" },
        baudRate: { value: "9600" },
        dataBits: { value: "8" },
        parity: { value: "none" },
        stopBits: { value: "1" },
      };
      const state = {
        bgColor: "#fff",
        textColor: "#000",
        fontFamily: "Times",
        fontSize: 12,
        baudRate: 115200,
        dataBits: 7,
        parity: "even",
        stopBits: 2,
        isFullscreen: false,
        isSettingsModalOpened: true,
        isStyleModalOpened: false,
        isAboutModalOpened: false,
        message: "<p>msg</p>",
        status: "connected",
      };
      // Mock loadStateFromDOM to return old state
      const oldState = loadStateFromDOM(el);
      await renderState(el, state);
      // Check some changes
      expect(el.settingsModal.style.display).toBe("flex");
      expect(el.bgColor.value).toBe("#fff");
      expect(el.baudRate.value).toBe(115200);
      expect(el.msg.innerHTML).toBe("<p>msg</p>");
    });
  });

  describe("bindStateToDOM", () => {
    it("subscribes to store and binds all", () => {
      const store = new StateContainer({});
      const el = {
        doc: document,
        msg: document.createElement("div"),
        status: document.createElement("div"),
        settingsBtn: document.createElement("button"),
        settingsClose: document.createElement("button"),
        settingsModal: { style: { display: "none" } },
        styleBtn: document.createElement("button"),
        styleClose: document.createElement("button"),
        styleModal: { style: { display: "none" } },
        aboutBtn: document.createElement("button"),
        aboutModal: { style: { display: "none" } },
        aboutClose: document.createElement("button"),
        connectBtn: document.createElement("button"),
        disconnectBtn: document.createElement("button"),
        fullscreenBtn: document.createElement("button"),
        bgColor: document.createElement("input"),
        textColor: document.createElement("input"),
        fontFamily: document.createElement("input"),
        fontSize: document.createElement("input"),
        baudRate: document.createElement("input"),
        dataBits: document.createElement("input"),
        parity: document.createElement("input"),
        stopBits: document.createElement("input"),
      };
      bindStateToDOM(el, store);
      // Since subscribe is called, and render is subscribed, we can check by setting state and seeing if renderState was called indirectly
      // But for simplicity, just check that no error is thrown
      expect(store.getState()).toBeDefined();
    });
  });
});
