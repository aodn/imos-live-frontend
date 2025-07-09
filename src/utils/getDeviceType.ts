export type DeviceType = 'android' | 'ios' | 'desktop';

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent || navigator.vendor || '';

  if (/android/i.test(userAgent)) {
    return 'android';
  } else if (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (userAgent.includes('Macintosh') && 'ontouchend' in document)
  ) {
    return 'ios';
  } else {
    return 'desktop';
  }
}
