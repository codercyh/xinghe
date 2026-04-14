'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  className = '',
  label,
  placeholder = '请选择',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-[#475569] text-xs text-center mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input-field text-center py-2.5 px-3 w-full flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className={selected ? 'text-[#F1F5F9]' : 'text-[#475569]'}>
          {selected?.label ?? placeholder}
        </span>
        <span className={`text-[#94A3B8] text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[120px] max-h-[220px] overflow-y-auto bg-[#1A1A2E] border border-[#2D2D44] rounded-lg shadow-xl z-[100] scrollbar-thin">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-[rgba(99,102,241,0.2)] text-[#818CF8]'
                  : 'text-[#94A3B8] hover:bg-[#252540] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
