/**
 * https://stackoverflow.com/a/34749873
 * EXAMPLE USAGE
 * mergeDeep(this, { a: { b: { c: 123 } } });
 * // or
 * const merged = mergeDeep({a: 1}, { b : { c: { d: { e: 12345}}}});  
 * console.dir(merged); // { a: 1, b: { c: { d: [Object] } } }  
 */

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}