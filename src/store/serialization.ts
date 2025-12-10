export const serialize = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';

  return JSON.stringify(value);
};

export const deserialize = (value: string): any => {
  if (value === '1') return true;
  if (value === '0') return false;

  // check number, include minus number. date like 2011-11-01 will not be seen as number.
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }

  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};
