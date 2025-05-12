export type FixedLengthArray<T, L extends number, A extends T[] = []> = A['length'] extends L
  ? A
  : FixedLengthArray<T, L, [...A, T]>;
