import React, { useState, useEffect } from 'react';
import Select, { MultiValue, SingleValue } from 'react-select';
import { SelectOption } from '../../types';

interface DynamicDropdownProps {
  label: string;
  name: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  loadOptions: () => Promise<SelectOption[]>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  isMulti?: boolean;
  isSearchable?: boolean;
  className?: string;
  dependsOn?: string | null;
  cacheKey?: string;
}

const DynamicDropdown: React.FC<DynamicDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  loadOptions,
  placeholder = 'Select...',
  required = false,
  error,
  isMulti = false,
  isSearchable = true,
  className,
  dependsOn,
  cacheKey,
}) => {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Reset when dependency changes
    if (dependsOn !== undefined) {
      setOptions([]);
      setHasLoaded(false);
      if (!isMulti) {
        onChange('');
      } else {
        onChange([]);
      }
    }
  }, [dependsOn, isMulti, onChange]);

  useEffect(() => {
    const fetchOptions = async () => {
      // Don't load if depends on something that's not selected
      if (dependsOn !== undefined && !dependsOn) {
        return;
      }

      // Don't reload if already loaded (unless dependency changed)
      if (hasLoaded && cacheKey === dependsOn) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await loadOptions();
        setOptions(data);
        setHasLoaded(true);
      } catch (error) {
        console.error('Error loading options:', error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [loadOptions, dependsOn, hasLoaded, cacheKey]);

  const handleChange = (
    newValue: SingleValue<SelectOption> | MultiValue<SelectOption>
  ) => {
    if (isMulti) {
      const values = (newValue as MultiValue<SelectOption>).map(opt => opt.value);
      onChange(values);
    } else {
      const singleValue = newValue as SingleValue<SelectOption>;
      onChange(singleValue ? singleValue.value : '');
    }
  };

  const getValue = () => {
    if (isMulti && Array.isArray(value)) {
      return options.filter(opt => value.includes(opt.value));
    } else if (!isMulti && value) {
      return options.find(opt => opt.value === value) || null;
    }
    return isMulti ? [] : null;
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : provided.boxShadow,
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6',
      },
    }),
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Select
        name={name}
        value={getValue()}
        onChange={handleChange}
        options={options}
        isMulti={isMulti}
        isSearchable={isSearchable}
        isLoading={isLoading}
        isDisabled={dependsOn !== undefined && !dependsOn}
        placeholder={placeholder}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        loadingMessage={() => 'Loading...'}
        noOptionsMessage={() => 
          dependsOn !== undefined && !dependsOn 
            ? 'Please select a parent option first' 
            : 'No options available'
        }
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default DynamicDropdown;
