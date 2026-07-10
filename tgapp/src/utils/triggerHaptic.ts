
export const triggerHaptic = (type: 'light' | 'medium' | 'selection') => {
    const haptic = window.Telegram?.WebApp?.HapticFeedback;
    if (!haptic) return;
    if (type === 'selection') haptic.selectionChanged();
    else haptic.impactOccurred(type);
  };