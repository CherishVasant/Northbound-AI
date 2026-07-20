import { useId } from 'react';
import { tint } from '@/lib/constants/placement';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  const id = useId();
  
  const trackStyle = checked
    ? {
        backgroundColor: tint('--sky', 12),
        borderColor: tint('--sky', 35),
      }
    : {
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--border)',
      };

  const thumbStyle = checked
    ? {
        backgroundColor: 'var(--sky)',
      }
    : {
        backgroundColor: 'var(--text-dim)',
      };

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-1.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={label}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className="w-9 h-5 rounded-full border transition-colors duration-200"
          style={trackStyle}
        />
        <div
          className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
          style={thumbStyle}
        />
      </div>
    </label>
  );
}
