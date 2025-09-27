import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';

interface WorkdayHierarchicalDropdownProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  dataAutomationId?: string;
  endpoints: {
    level1: string;
    level2: string;
  };
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface Option {
  id: string;
  name: string;
  hasChildren?: boolean;
}

interface NavigationState {
  level: 1 | 2;
  level1Value?: string;
  level1Label?: string;
}

const WorkdayHierarchicalDropdown: React.FC<WorkdayHierarchicalDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  dataAutomationId,
  endpoints,
  placeholder = 'Select...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [navigation, setNavigation] = useState<NavigationState>({ level: 1 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse the value to determine current state
  useEffect(() => {
    if (value) {
      const parts = value.split('|');
      if (parts.length === 2) {
        // We have a complete selection (e.g., "US|CA")
        setNavigation({
          level: 2,
          level1Value: parts[0],
          level1Label: parts[0] // In real app, we'd look this up
        });
      }
    }
  }, [value]);

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

  // Load options based on current navigation level
  const loadOptions = async () => {
    setLoading(true);
    try {
      let response;
      
      if (navigation.level === 1) {
        // Load level 1 options (e.g., countries)
        response = await api.post(endpoints.level1, {});
      } else {
        // Load level 2 options (e.g., states for selected country)
        response = await api.post(endpoints.level2, {
          parentValue: navigation.level1Value
        });
      }
      
      setOptions(response.data);
    } catch (error) {
      console.error('Failed to load options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load options when dropdown opens or navigation changes
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, navigation.level, navigation.level1Value]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleBack = () => {
    setNavigation({ level: 1 });
    onChange(''); // Clear the selection
    setSearchTerm('');
  };

  const handleSelect = (option: Option) => {
    console.log('[WorkdayHierarchical] handleSelect:', option);
    
    if (navigation.level === 1) {
      // Selected a level 1 item
      // First, set the value to trigger GoApply's selection detection
      onChange(option.id);
      
      // Trigger a DOM event that GoApply can detect
      const button = buttonRef.current;
      if (button) {
        // Simulate what real Workday does
        button.setAttribute('aria-label', option.name);
        button.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Then navigate to level 2 if the option has children
      if (option.hasChildren) {
        console.log('[WorkdayHierarchical] Option has children, navigating to level 2');
        setNavigation({
          level: 2,
          level1Value: option.id,
          level1Label: option.name
        });
        setSearchTerm('');
        // Keep dropdown open for child selection
      } else {
        console.log('[WorkdayHierarchical] Option has no children, closing');
        // No children, close the dropdown
        setIsOpen(false);
        setSearchTerm('');
      }
    } else {
      // Selected a level 2 item, complete the selection
      const fullValue = `${navigation.level1Value}|${option.id}`;
      onChange(fullValue);
      
      // Trigger DOM event
      const button = buttonRef.current;
      if (button) {
        button.setAttribute('aria-label', `${navigation.level1Label} > ${option.name}`);
        button.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getDisplayValue = () => {
    if (!value) return '';
    
    const parts = value.split('|');
    if (parts.length === 2) {
      // Full selection (country|state)
      if (navigation.level === 2) {
        const selected = options.find(opt => opt.id === parts[1]);
        if (selected) {
          return `${navigation.level1Label} > ${selected.name}`;
        }
      }
      return value;
    } else if (parts.length === 1 && navigation.level === 2) {
      // Just country selected, but we're viewing states
      return navigation.level1Label || value;
    }
    
    // Single value (just country)
    const country = options.find(opt => opt.id === value);
    return country ? country.name : value;
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      data-automation-id="multiSelectContainer"
      data-is-hierarchical="true"
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm
          flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500' : 'border-gray-300'}
        `}
        data-automation-id={dataAutomationId}
        data-uxi-widget-type="selectinput"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      >
        <span className={getDisplayValue() ? 'text-gray-900' : 'text-gray-400'}>
          {getDisplayValue() || placeholder}
        </span>
        <svg
          className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Back button for level 2 */}
          {navigation.level === 2 && (
            <div className="p-2 border-b border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to {navigation.level === 2 ? 'Countries' : 'Previous'}
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-8 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm">Loading...</p>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                No options found
              </div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between group"
                    >
                      <span>{option.name}</span>
                      {navigation.level === 1 && option.hasChildren && (
                        <svg
                          className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkdayHierarchicalDropdown;
