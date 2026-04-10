type Fn<T> = (input: T) => T;

export function pipe<T>(...fns: Fn<T>[]) {
  return function (x: T) {
    return fns.reduce(function (v, f) {
      return f(v);
    }, x);
  };
}
