import React, { useState, useEffect } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { MultiValue, SingleValue } from 'react-select';
import { SelectOption, PaginatedResponse } from '../../types';

interface ProgressiveDropdownProps {
  label: string;
  name: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  loadOptions: (params: {
    search: string;
    limit: number;
    offset: number;
  }) => Promise<PaginatedResponse<SelectOption>>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  isMulti?: boolean;
  className?: string;
  pageSize?: number;
  debounceMs?: number;
}

const ProgressiveDropdown: React.FC<ProgressiveDropdownProps> = ({
  label,
  name,
  value,
  onChange,
  loadOptions,
  placeholder = 'Type to search...',
  required = false,
  error,
  isMulti = false,
  className,
  pageSize = 20,
  debounceMs = 300,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([]);

  // Load initial selected values
  useEffect(() => {
    const loadSelectedOptions = async () => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        // In a real app, you'd have an endpoint to fetch specific options by IDs
        // For now, we'll just search for them
        const valuesToLoad = Array.isArray(value) ? value : [value];
        const loadedOptions: SelectOption[] = [];
        
        for (const val of valuesToLoad) {
          try {
            const response = await loadOptions({ search: val, limit: 1, offset: 0 });
            const option = response.items.find(opt => opt.value === val);
            if (option) {
              loadedOptions.push(option);
            }
          } catch (error) {
            console.error('Error loading selected option:', error);
          }
        }
        
        setSelectedOptions(loadedOptions);
      }
    };
    
    loadSelectedOptions();
  }, [value, loadOptions]);

  // AsyncPaginate loader compatible with backend pagination
  const loadPaginatedOptions = async (
    inputValue: string,
    loadedOptions: any,
    additional: { offset: number } | undefined
  ) => {
    try {
      const offset = additional?.offset ?? 0;
      const response = await loadOptions({
        search: inputValue,
        limit: pageSize,
        offset,
      });
      const options = response.items;
      const newOffset = offset + response.items.length;
      return {
        options,
        hasMore: response.hasMore,
        additional: { offset: newOffset },
      };
    } catch (err) {
      console.error('Error loading options:', err);
      return { options: [], hasMore: false, additional: { offset: additional?.offset ?? 0 } };
    }
  };

  const handleChange = (
    newValue: SingleValue<SelectOption> | MultiValue<SelectOption>
  ) => {
    if (isMulti) {
      const values = (newValue as MultiValue<SelectOption>).map(opt => opt.value);
      onChange(values);
      setSelectedOptions(newValue as SelectOption[]);
    } else {
      const singleValue = newValue as SingleValue<SelectOption>;
      onChange(singleValue ? singleValue.value : '');
      setSelectedOptions(singleValue ? [singleValue] : []);
    }
  };

  const getValue = () => {
    if (isMulti) {
      return selectedOptions;
    } else {
      return selectedOptions[0] || null;
    }
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
    menu: (provided: any) => ({
      ...provided,
      maxHeight: '300px',
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: '300px',
      paddingBottom: '0',
    }),
  };

  const formatOptionLabel = (option: SelectOption) => (
    <div className="flex items-center justify-between">
      <span>{option.label}</span>
      {option.meta && (
        <span className="text-xs text-gray-500 ml-2">{option.meta}</span>
      )}
    </div>
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <AsyncPaginate
        name={name}
        value={getValue()}
        onChange={handleChange}
        loadOptions={loadPaginatedOptions}
        additional={{ offset: 0 }}
        debounceTimeout={debounceMs}
        isMulti={isMulti}
        placeholder={placeholder}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        cacheUniqs={[pageSize]}
        defaultOptions
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={({ inputValue }) => 
          inputValue ? 'No results found' : 'Start typing to search...'
        }
        loadingMessage={() => 'Loading options...'}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

    </div>
  );
};

export default ProgressiveDropdown;
