/**
 * Concat two Uint8Arrays
 * @param {Uint8Array<ArrayBuffer>} arr1
 * @param {Uint8Array<ArrayBuffer>} arr2
 * @returns {Uint8Array<ArrayBuffer>}
 */
export function uint8ArrayConcat(arr1, arr2) {
  const result = new Uint8Array(arr1.length + arr2.length);
  result.set(arr1);
  result.set(arr2, arr1.length);
  return result;
}

/**
 * Split Uint8Array by another Uint8Array
 * @param {Uint8Array<ArrayBuffer>} array - Target array
 * @param {Uint8Array<ArrayBuffer>} splitter - Splitter
 * @returns {Uint8Array<ArrayBuffer>[]}
 */
export function uint8ArraySplitBySeq(array, splitter) {
  if (splitter.length === 0) {
    return [array];
  }

  const result = [];
  let start = 0;

  for (let i = 0; i <= array.length - splitter.length; i++) {
    // Check if splitter matches at position i
    let matches = true;
    for (let j = 0; j < splitter.length; j++) {
      if (array[i + j] !== splitter[j]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Found a match, add the part before it
      result.push(array.slice(start, i));
      start = i + splitter.length;
      i = start - 1; // -1 because loop will increment
    }
  }

  // Add the remaining part
  result.push(array.slice(start));

  return result;
}
