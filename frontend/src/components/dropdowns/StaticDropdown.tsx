import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface StaticDropdownProps {
  label: string;
  name: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  isMulti?: boolean;
  className?: string;
  dataAutomationId?: string;
}

const StaticDropdown: React.FC<StaticDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  error,
  isMulti = false,
  className,
  dataAutomationId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (isMulti && Array.isArray(value) && value.length > 0) {
      const selectedLabels = value.map(v => 
        options.find(opt => opt.value === v)?.label || v
      );
      return selectedLabels.join(', ');
    } else if (!isMulti && value) {
      return options.find(opt => opt.value === value)?.label || value;
    }
    return placeholder;
  };

  const isSelected = (optionValue: string) => {
    if (isMulti && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          'relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
          error ? 'border-red-300' : 'border-gray-300'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${name}-label`}
        data-automation-id={dataAutomationId}
      >
        <span className="block truncate">{getDisplayValue()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon
            className={clsx(
              'h-5 w-5 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          role="listbox"
          aria-labelledby={`${name}-label`}
          aria-multiselectable={isMulti}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={clsx(
                'cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100',
                option.disabled && 'opacity-50 cursor-not-allowed',
                isSelected(option.value) && 'bg-blue-50'
              )}
              role="option"
              aria-selected={isSelected(option.value)}
              onClick={() => !option.disabled && handleSelect(option.value)}
            >
              <span
                className={clsx(
                  'block truncate',
                  isSelected(option.value) ? 'font-semibold' : 'font-normal'
                )}
              >
                {option.label}
              </span>
              {isSelected(option.value) && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default StaticDropdown;
