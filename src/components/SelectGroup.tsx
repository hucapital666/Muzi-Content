import React from 'react';

interface SelectGroupProps {
  label: string;
  options: string[];
  selected: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
}

export function SelectGroup({ label, options, selected, onChange, multiple = false }: SelectGroupProps) {
  const isSelected = (option: string) => {
    if (multiple && Array.isArray(selected)) {
      return selected.includes(option);
    }
    return selected === option;
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${
              isSelected(option)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
