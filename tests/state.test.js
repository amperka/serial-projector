import { describe, it, expect, vi } from "vitest";
import { StateContainer } from "../src/state.js";

describe("StateContainer", () => {
  const initialState = {
    bgColor: "#ffffff",
    textColor: "#000000",
    fontFamily: "Arial",
    fontSize: 16,
    baudRate: 9600,
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    isFullscreen: false,
    isSettingsModalOpened: false,
    isStyleModalOpened: false,
    isAboutModalOpened: false,
    message: "",
    status: "Disconnected",
    lastPortInfo: null,
  };

  it("should initialize with the provided initial state", () => {
    const container = new StateContainer(initialState);
    expect(container.getState()).toEqual(initialState);
  });

  it("should initialize with an empty listeners set if none provided", () => {
    const container = new StateContainer(initialState);
    // Test indirectly by subscribing
    const listener = vi.fn();
    container.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should initialize with provided listeners", () => {
    const listener = vi.fn();
    const listeners = new Set([listener]);
    const container = new StateContainer(initialState, listeners);
    container.setState({ message: "test" });
    expect(listener).toHaveBeenCalledWith({ ...initialState, message: "test" });
  });

  it("getState should return a shallow copy of the state", () => {
    const container = new StateContainer(initialState);
    const state = container.getState();
    expect(state).toEqual(initialState);
    expect(state).not.toBe(initialState); // Should be a copy
  });

  it("setState should update the state with partial updates", () => {
    const container = new StateContainer(initialState);
    container.setState({ message: "Hello", status: "Connected" });
    const newState = container.getState();
    expect(newState.message).toBe("Hello");
    expect(newState.status).toBe("Connected");
    expect(newState.bgColor).toBe(initialState.bgColor); // Unchanged
  });

  it("setState should handle nested objects by merging", () => {
    const container = new StateContainer({
      ...initialState,
      lastPortInfo: { usbVendorId: 1, usbProductId: 2 },
    });
    container.setState({ lastPortInfo: { usbVendorId: 3 } });
    const newState = container.getState();
    expect(newState.lastPortInfo.usbVendorId).toBe(3);
    expect(newState.lastPortInfo.usbProductId).toBe(2); // Preserved
  });

  it("setState should not merge if the partial value is not an object", () => {
    const container = new StateContainer({
      ...initialState,
      lastPortInfo: { usbVendorId: 1 },
    });
    container.setState({ lastPortInfo: null });
    const newState = container.getState();
    expect(newState.lastPortInfo).toBe(null);
  });

  it("setState should notify all listeners", () => {
    const container = new StateContainer(initialState);
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    container.subscribe(listener1);
    container.subscribe(listener2);
    container.setState({ message: "Updated" });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith({
      ...initialState,
      message: "Updated",
    });
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith({
      ...initialState,
      message: "Updated",
    });
  });

  it("subscribe should add a listener and return an unsubscribe function", () => {
    const container = new StateContainer(initialState);
    const listener = vi.fn();
    const unsubscribe = container.subscribe(listener);
    container.setState({ message: "test" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    container.setState({ message: "test2" });
    expect(listener).toHaveBeenCalledTimes(1); // No more calls after unsubscribe
  });

  it("unsubscribe should remove the listener and return true if it existed", () => {
    const container = new StateContainer(initialState);
    const listener = vi.fn();
    container.subscribe(listener);
    const result = container.unsubscribe(listener);
    expect(result).toBe(true);
    container.setState({ message: "test" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe should return false if listener was not subscribed", () => {
    const container = new StateContainer(initialState);
    const listener = vi.fn();
    const result = container.unsubscribe(listener);
    expect(result).toBe(false);
  });

  it("should handle multiple subscribes and unsubscribes correctly", () => {
    const container = new StateContainer(initialState);
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    container.subscribe(listener1);
    container.subscribe(listener2);
    container.setState({ message: "1" });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    container.unsubscribe(listener1);
    container.setState({ message: "2" });
    expect(listener1).toHaveBeenCalledTimes(1); // No new call
    expect(listener2).toHaveBeenCalledTimes(2);
  });

  it("listeners should receive the updated state on notify", () => {
    const container = new StateContainer(initialState);
    const listener = vi.fn();
    container.subscribe(listener);
    container.setState({ bgColor: "#000000", fontSize: 20 });
    expect(listener).toHaveBeenCalledWith({
      ...initialState,
      bgColor: "#000000",
      fontSize: 20,
    });
  });

  it("should handle empty partial state updates", () => {
    const container = new StateContainer(initialState);
    const listener = vi.fn();
    container.subscribe(listener);
    container.setState({});
    expect(listener).toHaveBeenCalledTimes(1);
    expect(container.getState()).toEqual(initialState);
  });

  it("should handle setState with undefined values", () => {
    const container = new StateContainer(initialState);
    container.setState({ message: undefined });
    expect(container.getState().message).toBe(undefined);
  });
});
