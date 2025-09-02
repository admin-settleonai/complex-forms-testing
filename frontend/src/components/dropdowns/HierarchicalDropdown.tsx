import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  // Uses backend AJAX tree loader: /api/form-data/hierarchy/:tree
  ajaxTreeKey: 'categories' | 'skillsTree' | 'locations';
  placeholder?: string;
  searchPlaceholder?: string;
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
  ajaxTreeKey,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  required = false,
  error,
  className,
  showFullPath = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [remoteOptions, setRemoteOptions] = useState<HierarchicalOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; label: string; parentId?: string; hasChildren?: boolean; pathLabels: string[]; pathIds: string[] }>>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const searchDebounceRef = useRef<number | null>(null);
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

  // NOTE: Do not preload root nodes. Roots are fetched on first open (see onClick handler)

  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchHasMore(false);
      setSearchOffset(0);
      return;
    }
    searchDebounceRef.current = window.setTimeout(() => {
      performSearch(0, false);
    }, 300);
  }, [searchTerm, ajaxTreeKey]);

  const performSearch = async (offset: number, append: boolean) => {
    try {
      setIsSearching(true);
      const limit = 50;
      const { data } = await api.get(`/api/form-data/hierarchy/${ajaxTreeKey}/search`, {
        params: { search: searchTerm, limit, offset },
      });
      const items = (data.items || []) as Array<{ id: string; label: string; parentId?: string; hasChildren?: boolean; pathLabels: string[]; pathIds: string[] }>;
      setSearchResults(prev => (append ? [...prev, ...items] : items));
      setSearchHasMore(!!data.hasMore);
      setSearchOffset(offset);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreSearchResults = async () => {
    if (!searchHasMore || isSearching) return;
    await performSearch(searchOffset + 50, true);
  };

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
    const source = remoteOptions;
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
    const source = remoteOptions;
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

  const upsertPath = (opts: HierarchicalOption[], pathIds: string[], pathLabels: string[]): HierarchicalOption[] => {
    const clone = JSON.parse(JSON.stringify(opts)) as HierarchicalOption[];
    let levelArray: HierarchicalOption[] = clone;
    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];
      const label = pathLabels[i] || id;
      let node = levelArray.find(n => n.value === id);
      if (!node) {
        node = {
          value: id,
          label,
          parent: i > 0 ? pathIds[i - 1] : undefined,
          hasChildren: i < pathIds.length - 1,
          children: i < pathIds.length - 1 ? [] : undefined,
        } as HierarchicalOption;
        levelArray.push(node);
      } else {
        node.label = label;
        if (i > 0) node.parent = pathIds[i - 1];
        if (i < pathIds.length - 1) node.hasChildren = true;
        if (i < pathIds.length - 1 && !node.children) node.children = [];
      }
      if (i < pathIds.length - 1) {
        levelArray = (node.children as HierarchicalOption[]) || [];
      }
    }
    return clone;
  };

  const handleSelectFromSearch = (
    item: { id: string; label: string; parentId?: string; hasChildren?: boolean; pathLabels: string[]; pathIds: string[] },
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const newValue = new Set(value);
    setRemoteOptions(prev => upsertPath(prev, item.pathIds, item.pathLabels));
    const isAlreadySelected = newValue.has(item.id);
    if (isAlreadySelected) {
      newValue.delete(item.id);
      const existing = findOption(remoteOptions, item.id);
      if (existing) removeAllChildren(existing, newValue);
    } else {
      newValue.add(item.id);
      if (item.pathIds && item.pathIds.length > 1) {
        for (let i = 0; i < item.pathIds.length - 1; i++) {
          newValue.add(item.pathIds[i]);
        }
      }
    }
    onChange(Array.from(newValue));
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
        onClick={async () => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen && ajaxTreeKey && remoteOptions.length === 0) {
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
          }
        }}
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
          <div className="px-2 pb-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="block w-full rounded-md border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          {searchTerm.trim() ? (
            <div className="py-1" role="listbox">
              {isSearching && searchResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              )}
              {!isSearching && searchResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No results</div>
              )}
              {searchResults.map(item => {
                const isSelected = value.includes(item.id);
                const path = item.pathLabels.join(' > ');
                return (
                  <div
                    key={item.id}
                    className={clsx('flex items-center cursor-pointer hover:bg-gray-100 select-none px-2 py-2', isSelected && 'bg-blue-50')}
                    onClick={(e) => handleSelectFromSearch(item, e)}
                  >
                    <span className={clsx('text-sm flex-1 truncate', isSelected && 'font-semibold text-blue-700')}>{path}</span>
                    {isSelected && <CheckIcon className="h-4 w-4 text-blue-600" />}
                  </div>
                );
              })}
              {searchHasMore && (
                <div className="border-t border-gray-200 px-3 py-2">
                  <button
                    type="button"
                    className={clsx('text-sm text-blue-600 hover:text-blue-800', isSearching && 'opacity-50 cursor-not-allowed')}
                    onClick={(e) => { e.stopPropagation(); loadMoreSearchResults(); }}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-1" role="tree">
              {remoteOptions.map(option => renderOption(option))}
            </div>
          )}
          
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
