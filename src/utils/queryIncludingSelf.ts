/**
 * make the query result include container itself.
 * @param container
 * @param selector classname
 * @returns
 */
export function queryIncludingSelf<T extends Element>(
  container: T,
  selector: string,
): (T | Element)[] {
  const matches = Array.from(container.querySelectorAll(selector));
  if (container.matches(selector)) {
    matches.unshift(container);
  }
  return matches;
}
