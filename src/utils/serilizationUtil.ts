export const serialize = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const deserialize = (value: string | null, originalValueType: any): any => {
  if (!value) return undefined;
  if (originalValueType === 'boolean') return value === '1';
  if (originalValueType === 'number') {
    const num = Number(value);
    return isNaN(num) ? originalValueType : num;
  }
  if (originalValueType === 'string') return value;
  if (originalValueType === 'object' && originalValueType !== null) {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
};
