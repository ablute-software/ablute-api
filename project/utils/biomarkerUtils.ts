export const determineBiomarkerStatus = (value: number | undefined | null, reference: string | undefined | null): 'normal' | 'high' | 'low' => {
  if (value === undefined || value === null || !reference) {
    return 'normal';
  }

  // Handle reference ranges with < or > symbols
  if (reference.startsWith('<')) {
    const threshold = parseFloat(reference.substring(1).trim());
    return value < threshold ? 'normal' : 'high';
  }
  if (reference.startsWith('>')) {
    const threshold = parseFloat(reference.substring(1).trim());
    return value > threshold ? 'normal' : 'low';
  }

  // Handle reference ranges with min-max format
  const [min, max] = reference.split('-').map(v => parseFloat(v.trim()));
  if (!isNaN(min) && !isNaN(max)) {
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  }

  return 'normal';
}; 