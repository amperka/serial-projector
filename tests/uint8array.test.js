import { describe, it, expect } from "vitest";
import { uint8ArrayConcat } from "../src/uint8array.js";

describe("uint8ArrayConcat", () => {
  it("should concatenate two empty arrays", () => {
    const arr1 = new Uint8Array([]);
    const arr2 = new Uint8Array([]);
    const result = uint8ArrayConcat(arr1, arr2);
    expect(result).toEqual(new Uint8Array([]));
  });

  it("should concatenate an empty array with a non-empty array", () => {
    const arr1 = new Uint8Array([]);
    const arr2 = new Uint8Array([1, 2, 3]);
    const result = uint8ArrayConcat(arr1, arr2);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("should concatenate two non-empty arrays", () => {
    const arr1 = new Uint8Array([1, 2]);
    const arr2 = new Uint8Array([3, 4, 5]);
    const result = uint8ArrayConcat(arr1, arr2);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });
});
