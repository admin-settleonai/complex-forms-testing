import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface HierarchicalOption {
  value: string;
  label: string;
  children?: HierarchicalOption[];
  parent?: string;
  hasChildren?: boolean;
}

interface HierarchicalDropdownProps {
  label: string;
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  options?: HierarchicalOption[]; // optional when using AJAX
  // When set, uses backend AJAX tree loader: /api/form-data/hierarchy/:tree
  ajaxTreeKey?: 'categories' | 'skillsTree' | 'locations';
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  showFullPath?: boolean;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({
  label,
  name,
  value = [],
  onChange,
  options = [],
  ajaxTreeKey,
  placeholder = 'Select options...',
  required = false,
  error,
  className,
  showFullPath = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [remoteOptions, setRemoteOptions] = useState<HierarchicalOption[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load root nodes when using AJAX
  useEffect(() => {
    const loadRoot = async () => {
      if (!ajaxTreeKey) return;
      if (remoteOptions.length > 0) return;
      try {
        const { data } = await api.get(`/api/form-data/hierarchy/${ajaxTreeKey}`);
        const roots: HierarchicalOption[] = data.map((n: any) => ({
          value: n.id,
          label: n.label,
          parent: undefined,
          hasChildren: !!n.hasChildren,
          children: n.hasChildren ? [] : undefined,
        }));
        setRemoteOptions(roots);
      } catch (e) {
        console.error('Failed to load root nodes', e);
      }
    };
    loadRoot();
  }, [ajaxTreeKey, remoteOptions.length]);

  const ensureChildrenLoaded = async (nodeValue: string) => {
    if (!ajaxTreeKey) return;
    const target = findOption(remoteOptions, nodeValue);
    if (target && target.children && target.children.length > 0) return;
    try {
      const { data } = await api.get(`/api/form-data/hierarchy/${ajaxTreeKey}`, {
        params: { parentId: nodeValue },
      });
      const children: HierarchicalOption[] = data.map((n: any) => ({
        value: n.id,
        label: n.label,
        parent: n.parentId,
        hasChildren: !!n.hasChildren,
        children: n.hasChildren ? [] : undefined,
      }));
      setRemoteOptions(prev => addChildren(prev, nodeValue, children));
    } catch (e) {
      console.error('Failed to load children', e);
    }
  };

  const addChildren = (opts: HierarchicalOption[], parentValue: string, children: HierarchicalOption[]): HierarchicalOption[] => {
    const clone = JSON.parse(JSON.stringify(opts)) as HierarchicalOption[];
    const parent = findOption(clone, parentValue);
    if (parent) {
      parent.children = children;
      parent.hasChildren = children.length > 0;
    }
    return clone;
  };

  const toggleExpanded = async (nodeValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeValue)) {
      newExpanded.delete(nodeValue);
    } else {
      newExpanded.add(nodeValue);
    }
    setExpandedNodes(newExpanded);
    if (ajaxTreeKey) {
      await ensureChildrenLoaded(nodeValue);
    }
  };

  const handleSelect = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newValue = new Set(value);
    const source = ajaxTreeKey ? remoteOptions : options;
    const option = findOption(source, optionValue);
    
    if (!option) return;

    // Toggle selection
    if (newValue.has(optionValue)) {
      // Deselect this option and all its children
      newValue.delete(optionValue);
      removeAllChildren(option, newValue);
    } else {
      // Select this option
      newValue.add(optionValue);
      // If it has a parent, ensure parent is selected too
      if (option.parent) {
        selectAllParents(source, option.parent, newValue);
      }
    }

    onChange(Array.from(newValue));
  };

  const findOption = (opts: HierarchicalOption[], value: string): HierarchicalOption | null => {
    for (const opt of opts) {
      if (opt.value === value) return opt;
      if (opt.children) {
        const found = findOption(opt.children, value);
        if (found) return found;
      }
    }
    return null;
  };

  const removeAllChildren = (option: HierarchicalOption, valueSet: Set<string>) => {
    if (option.children) {
      option.children.forEach(child => {
        valueSet.delete(child.value);
        removeAllChildren(child, valueSet);
      });
    }
  };

  const selectAllParents = (opts: HierarchicalOption[], parentValue: string, valueSet: Set<string>) => {
    const parent = findOption(opts, parentValue);
    if (parent) {
      valueSet.add(parent.value);
      if (parent.parent) {
        selectAllParents(opts, parent.parent, valueSet);
      }
    }
  };

  const getDisplayValue = () => {
    if (value.length === 0) return placeholder;
    
    const selectedLabels: string[] = [];
    const source = ajaxTreeKey ? remoteOptions : options;
    value.forEach(val => {
      const option = findOption(source, val);
      if (option) {
        if (showFullPath && option.parent) {
          const path = getFullPath(source, option);
          selectedLabels.push(path);
        } else {
          selectedLabels.push(option.label);
        }
      }
    });
    
    return selectedLabels.join(', ');
  };

  const getFullPath = (opts: HierarchicalOption[], option: HierarchicalOption): string => {
    const path: string[] = [option.label];
    let current = option;
    
    while (current.parent) {
      const parent = findOption(opts, current.parent);
      if (parent) {
        path.unshift(parent.label);
        current = parent;
      } else {
        break;
      }
    }
    
    return path.join(' > ');
  };

  const renderOption = (option: HierarchicalOption, level: number = 0) => {
    const hasChildren = !!(option.hasChildren || (option.children && option.children.length > 0));
    const isExpanded = expandedNodes.has(option.value);
    const isSelected = value.includes(option.value);
    const isPartiallySelected = !isSelected && hasChildren && 
      option.children!.some(child => isChildSelected(child));

    return (
      <div key={option.value}>
        <div
          className={clsx(
            'flex items-center cursor-pointer hover:bg-gray-100 select-none',
            isSelected && 'bg-blue-50',
            level > 0 && 'border-l-2 border-gray-200'
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={(e) => handleSelect(option.value, e)}
        >
          {hasChildren && (
            <button
              type="button"
              className="p-1 hover:bg-gray-200 rounded"
              onClick={(e) => toggleExpanded(option.value, e)}
            >
              <ChevronRightIcon
                className={clsx(
                  'h-4 w-4 text-gray-500 transition-transform',
                  isExpanded && 'transform rotate-90'
                )}
              />
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex-1 py-2 px-2 flex items-center justify-between">
            <span className={clsx(
              'text-sm',
              isSelected && 'font-semibold text-blue-700'
            )}>
              {option.label}
            </span>
            {(isSelected || isPartiallySelected) && (
              <CheckIcon 
                className={clsx(
                  'h-4 w-4',
                  isSelected ? 'text-blue-600' : 'text-gray-400'
                )}
              />
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {option.children!.map(child => renderOption(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isChildSelected = (option: HierarchicalOption): boolean => {
    if (value.includes(option.value)) return true;
    if (option.children) {
      return option.children.some(child => isChildSelected(child));
    }
    return false;
  };

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <button
        type="button"
        className={clsx(
          'relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
          error ? 'border-red-300' : 'border-gray-300'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="tree"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-gray-700">
          {getDisplayValue()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon
            className={clsx(
              'h-5 w-5 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto">
          <div className="py-1" role="tree">
            {(ajaxTreeKey ? remoteOptions : options).map(option => renderOption(option))}
          </div>
          
          {value.length > 0 && (
            <div className="border-t border-gray-200 px-3 py-2">
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
              >
                Clear all selections
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {value.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          {value.length} item{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default HierarchicalDropdown;
