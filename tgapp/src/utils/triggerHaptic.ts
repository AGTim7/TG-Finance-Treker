
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection') => {
    const haptic = window.Telegram?.WebApp?.HapticFeedback;
    if (!haptic) return;
    if (type === 'selection') haptic.selectionChanged();
    else haptic.impactOccurred(type);
  };