export function isNumeric(value: any) {
  return (function (v) {
    if (typeof v === 'number') {
      return Number.isFinite(v);
    }

    return v !== null && v !== '' && Number.isFinite(Number(v));
  })(value);
}
