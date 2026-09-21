import { useEffect, useState } from 'react';
import { detectTouchDrive } from '@/input/driveInput';

/** Phone / tablet: hide stacked chrome and show the cruise-style sticks. */
export function useCompactHud(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => setCompact(detectTouchDrive());
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return compact;
}
