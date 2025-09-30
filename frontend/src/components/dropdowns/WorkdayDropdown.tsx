import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';

interface WorkdayDropdownProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  dataAutomationId?: string;
  endpoint: string;
  placeholder?: string;
  disabled?: boolean;
  parentValue?: string; // For dependent dropdowns
  className?: string;
}

const WorkdayDropdown: React.FC<WorkdayDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  dataAutomationId,
  endpoint,
  placeholder = 'Select...',
  disabled = false,
  parentValue,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load options when dropdown opens or parent value changes
  useEffect(() => {
    if (isOpen || parentValue !== undefined) {
      loadOptions();
    }
  }, [isOpen, parentValue]);

  // Listen for external changes to the input element (from GoApply)
  useEffect(() => {
    if (!inputRef.current) return;

    const handleExternalChange = () => {
      const newValue = inputRef.current?.value || '';
      if (newValue !== value) {
        console.log(`[WorkdayDropdown] External change detected: ${name} = ${newValue}`);
        onChange(newValue);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          handleExternalChange();
        }
      });
    });

    observer.observe(inputRef.current, { 
      attributes: true, 
      attributeFilter: ['value'] 
    });

    // Also listen for programmatic value changes
    inputRef.current.addEventListener('input', handleExternalChange);
    inputRef.current.addEventListener('change', handleExternalChange);

    return () => {
      observer.disconnect();
      if (inputRef.current) {
        inputRef.current.removeEventListener('input', handleExternalChange);
        inputRef.current.removeEventListener('change', handleExternalChange);
      }
    };
  }, [value, onChange, name]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const response = await api.post(endpoint, {
        ...(parentValue !== undefined && { parentValue })
      });
      setOptions(response.data);
    } catch (error) {
      console.error('Failed to load options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
    buttonRef.current?.focus();
  };

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {/* Accessible input for GoApply discovery */}
      <input
        ref={inputRef}
        type="text"
        name={name}
        id={name}
        data-automation-id={dataAutomationId}
        value={value}
        onChange={() => {}} // Controlled by external updates
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
        tabIndex={-1}
      />
      
      <button
        ref={buttonRef}
        type="button"
        data-automation-id={dataAutomationId}
        data-selected-value={value}
        data-selected-text={selectedOption?.name || ''}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm 
          pl-3 pr-10 py-2 text-left cursor-default focus:outline-none 
          focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
          role="listbox"
        >
          {/* Search input for searchable dropdowns */}
          <div className="px-3 py-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  cursor-default select-none relative py-2 pl-3 pr-9 
                  ${value === option.id ? 'text-white bg-blue-600' : 'text-gray-900 hover:bg-gray-100'}
                `}
                role="option"
                aria-selected={value === option.id}
              >
                <span className={`block truncate ${value === option.id ? 'font-semibold' : 'font-normal'}`}>
                  {option.name}
                </span>
                {value === option.id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-white">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WorkdayDropdown;
