'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: number;
  label: string;
  hint?: string;
}

interface SelectProps {
  value: number | null;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}

export function Select({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  emptyText = '暂无可选项',
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-sm transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bili-pink/25',
          open
            ? 'border-bili-pink/50 ring-2 ring-bili-pink/15'
            : 'border-gray-200 hover:border-gray-300',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span
          className={cn(
            'truncate',
            selected ? 'font-medium text-gray-900' : 'text-gray-400'
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-900/10"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">{emptyText}</p>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150',
                    isSelected
                      ? 'bg-bili-pink-50 text-bili-pink-dark'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="min-w-0 truncate font-medium">
                    {option.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {option.hint && (
                      <span className="text-xs text-gray-400">
                        {option.hint}
                      </span>
                    )}
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
