export function isMobileDevice() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || '';
  const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(userAgent);
  const touchTablet = navigator.maxTouchPoints > 1
    && window.matchMedia('(pointer: coarse)').matches
    && Math.min(window.screen.width, window.screen.height) <= 1024;

  return mobileUserAgent || touchTablet;
}
