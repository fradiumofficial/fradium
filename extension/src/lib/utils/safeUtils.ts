// Utility functions untuk safe property access di DetailHistory

export const safeToString = (value: any, defaultValue: string = "0"): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value.toString();
  }
  
  try {
    return value.toString();
  } catch {
    return defaultValue;
  }
};

export const safeToNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
};

export const safeArrayAccess = <T>(array: T[] | undefined | null, defaultValue: T[] = []): T[] => {
  return Array.isArray(array) ? array : defaultValue;
};

export const safeObjectAccess = <T>(obj: T | undefined | null, defaultValue: Partial<T> = {}): T => {
  return (obj && typeof obj === 'object') ? obj : defaultValue as T;
};
