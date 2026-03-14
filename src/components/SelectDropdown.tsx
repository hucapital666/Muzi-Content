import React from 'react';

interface SelectDropdownProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function SelectDropdown({ label, options, selected, onChange }: SelectDropdownProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">{label}</h3>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
