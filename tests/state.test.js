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

    describe("edge cases", () => {
      it("should handle setState with undefined partial state", () => {
        const container = new StateContainer(initialState);
        const listener = vi.fn();
        container.subscribe(listener);
        container.setState(undefined);
        expect(listener).toHaveBeenCalledWith(initialState);
      });

      it("should handle setState with null partial state", () => {
        const container = new StateContainer(initialState);
        const listener = vi.fn();
        container.subscribe(listener);
        container.setState(null);
        expect(listener).toHaveBeenCalledWith(initialState);
      });

      it("should handle deeply nested objects", () => {
        const container = new StateContainer({
          nested: {
            deep: {
              value: "original",
            },
          },
        });
        container.setState({
          nested: {
            deep: {
              value: "updated",
            },
          },
        });
        expect(container.getState().nested.deep.value).toBe("updated");
      });

      it("should handle adding new properties to nested objects", () => {
        const container = new StateContainer({
          nested: {
            existing: "value",
          },
        });
        container.setState({
          nested: {
            existing: "value",
            newProp: "new value",
          },
        });
        expect(container.getState().nested.existing).toBe("value");
        expect(container.getState().nested.newProp).toBe("new value");
      });

      it("should handle removing properties from nested objects", () => {
        const container = new StateContainer({
          nested: {
            prop1: "value1",
            prop2: "value2",
          },
        });
        container.setState({
          nested: {
            prop1: "value1",
          },
        });
        expect(container.getState().nested.prop1).toBe("value1");
        expect(container.getState().nested.prop2).toBeUndefined();
      });

      it("should handle array values in state", () => {
        const container = new StateContainer({
          items: [1, 2, 3],
        });
        container.setState({
          items: [4, 5, 6],
        });
        expect(container.getState().items).toEqual([4, 5, 6]);
      });

      it("should handle function values in state (edge case)", () => {
        const container = new StateContainer({});
        const testFn = () => "test";
        container.setState({
          callback: testFn,
        });
        expect(container.getState().callback).toBe(testFn);
      });

      it("should handle symbol values in state (edge case)", () => {
        const container = new StateContainer({});
        const testSymbol = Symbol("test");
        container.setState({
          symbolProp: testSymbol,
        });
        expect(container.getState().symbolProp).toBe(testSymbol);
      });

      it("should handle multiple rapid setState calls", () => {
        const container = new StateContainer(initialState);
        const listener = vi.fn();
        container.subscribe(listener);

        container.setState({ message: "first" });
        container.setState({ status: "updated" });
        container.setState({ message: "second" });

        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener).toHaveBeenNthCalledWith(1, {
          ...initialState,
          message: "first",
        });
        expect(listener).toHaveBeenNthCalledWith(2, {
          ...initialState,
          message: "first",
          status: "updated",
        });
        expect(listener).toHaveBeenNthCalledWith(3, {
          ...initialState,
          status: "updated",
          message: "second",
        });
      });

      it("should handle unsubscribe during state update", () => {
        const container = new StateContainer(initialState);
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        const unsubscribe1 = container.subscribe(listener1);
        container.subscribe(listener2);

        container.setState({ message: "test1" });
        unsubscribe1();
        container.setState({ message: "test2" });

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(2);
      });

      it("should handle subscribe during state update", () => {
        const container = new StateContainer(initialState);
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        container.subscribe(listener1);
        container.setState({ message: "test1" });
        container.subscribe(listener2);
        container.setState({ message: "test2" });

        expect(listener1).toHaveBeenCalledTimes(2);
        expect(listener2).toHaveBeenCalledTimes(1);
      });
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
