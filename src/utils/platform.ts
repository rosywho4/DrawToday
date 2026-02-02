export function isWeb(): boolean {
  return typeof window !== 'undefined' && !('Capacitor' in window);
}

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getPlatformInfo(): { isWeb: boolean; isMobile: boolean; isTouch: boolean } {
  return {
    isWeb: isWeb(),
    isMobile: isMobile(),
    isTouch: isTouchDevice()
  };
}
