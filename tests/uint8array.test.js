import { describe, it, expect } from "vitest";
import { uint8ArrayConcat, uint8ArraySplitBySeq } from "../src/uint8array.js";

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

describe("uint8ArraySplitBySeq", () => {
  it("should return the whole array when splitter is empty", () => {
    const array = new Uint8Array([1, 2, 3]);
    const splitter = new Uint8Array([]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([1, 2, 3])]);
  });

  it("should return the whole array when splitter is not found", () => {
    const array = new Uint8Array([1, 2, 3]);
    const splitter = new Uint8Array([4, 5]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([1, 2, 3])]);
  });

  it("should split array with one occurrence of splitter", () => {
    const array = new Uint8Array([1, 2, 3, 4, 5]);
    const splitter = new Uint8Array([3, 4]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([1, 2]), new Uint8Array([5])]);
  });

  it("should split array with multiple occurrences of splitter", () => {
    const array = new Uint8Array([1, 2, 3, 1, 2, 3]);
    const splitter = new Uint8Array([2, 3]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([
      new Uint8Array([1]),
      new Uint8Array([1]),
      new Uint8Array([]),
    ]);
  });

  it("should handle splitter at the beginning", () => {
    const array = new Uint8Array([1, 2, 3, 4]);
    const splitter = new Uint8Array([1, 2]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([]), new Uint8Array([3, 4])]);
  });

  it("should handle splitter at the end", () => {
    const array = new Uint8Array([1, 2, 3, 4]);
    const splitter = new Uint8Array([3, 4]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([1, 2]), new Uint8Array([])]);
  });

  it("should handle splitter longer than array", () => {
    const array = new Uint8Array([1, 2]);
    const splitter = new Uint8Array([1, 2, 3]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([1, 2])]);
  });

  it("should handle empty array", () => {
    const array = new Uint8Array([]);
    const splitter = new Uint8Array([1, 2]);
    const result = uint8ArraySplitBySeq(array, splitter);
    expect(result).toEqual([new Uint8Array([])]);
  });
});
