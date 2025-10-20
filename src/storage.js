/**
 * @typedef {import('./state.js').State} State
 * @typedef {import('./state.js').StateListener} StateListener
 * @typedef {Partial<State>} PartialState
 */

const PERSIST_STATE_KEY_PREFIX = "state_";
/** @type {(keyof State)[]} */
const PERSIST_STATE_STR_KEYS = ["bgColor", "textColor", "fontFamily", "parity"];
/** @type {(keyof State)[]} */
const PERSIST_STATE_NUM_KEYS = ["fontSize", "baudRate", "dataBits", "stopBits"];
/** @type {(keyof State)[]} */
const PERSIST_STATE_OBJ_KEYS = ["lastPortInfo"];
/** @type {(keyof State)[]} */
const PERSIST_STATE_BOOL_KEYS = [];

/** @type {(keyof State)[]} */
const PERSIST_STATE_KEYS = PERSIST_STATE_STR_KEYS.concat(PERSIST_STATE_NUM_KEYS)
  .concat(PERSIST_STATE_BOOL_KEYS)
  .concat(PERSIST_STATE_OBJ_KEYS);

/**
 * Save State subset to Local Storage
 * @type {StateListener}
 */
const saveState = (state) => {
  for (const [k, v] of Object.entries(state)) {
    if (!PERSIST_STATE_KEYS.includes(k)) continue;
    const lsKey = `${PERSIST_STATE_KEY_PREFIX}${k}`;
    if (PERSIST_STATE_OBJ_KEYS.includes(k)) {
      localStorage.setItem(lsKey, JSON.stringify(v));
      continue;
    }
    localStorage.setItem(lsKey, v);
  }
};

/**
 * Load state subset from Local Storage
 * @returns {PartialState}
 */
const loadState = () => {
  /** @type {PartialState} */
  const state = {};
  for (const k of PERSIST_STATE_KEYS) {
    const lsKey = `${PERSIST_STATE_KEY_PREFIX}${k}`;
    const value = localStorage.getItem(lsKey);
    if (value === null) continue;
    if (PERSIST_STATE_STR_KEYS.includes(k)) {
      state[k] = value;
    }
    if (PERSIST_STATE_NUM_KEYS.includes(k)) {
      state[k] = +value;
    }
    if (PERSIST_STATE_BOOL_KEYS.includes(k)) {
      state[k] = value === "true" ? true : false;
    }
    if (PERSIST_STATE_OBJ_KEYS.includes(k)) {
      state[k] = JSON.parse(value || "{}");
    }
  }
  return state;
};

export { loadState, saveState };
