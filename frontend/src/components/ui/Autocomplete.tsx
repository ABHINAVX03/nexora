import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check, Plus, Building2, GraduationCap, Code } from 'lucide-react';

export interface AutocompleteItem {
  id?: number | null;
  title: string;
  subtitle?: string;
  logoUrl?: string;
  isCustom?: boolean;
}

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  selectedId?: number | null;
  onSelect: (item: AutocompleteItem) => void;
  fetchOptions: (query: string) => Promise<AutocompleteItem[]>;
  iconType?: 'company' | 'institution' | 'skill';
  allowCustom?: boolean;
  customLabel?: string;
  required?: boolean;
  error?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  placeholder = 'Type to search...',
  value,
  selectedId,
  onSelect,
  fetchOptions,
  iconType = 'company',
  allowCustom = true,
  customLabel = 'Other / Not listed',
  required = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<AutocompleteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerSearch = (searchQuery: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchOptions(searchQuery);
        setOptions(results);
        setHighlightedIndex(results.length > 0 ? 0 : -1);
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    setIsOpen(true);
    triggerSearch(query);
  };

  const handleFocus = () => {
    setIsOpen(true);
    triggerSearch(inputValue);
  };

  const handleSelectItem = (item: AutocompleteItem) => {
    setInputValue(item.title);
    setIsOpen(false);
    onSelect(item);
  };

  const handleSelectCustom = () => {
    const customItem: AutocompleteItem = {
      id: null,
      title: inputValue.trim() || 'Custom',
      isCustom: true,
    };
    handleSelectItem(customItem);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        triggerSearch(inputValue);
      }
      return;
    }

    const totalOptions = options.length + (allowCustom ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelectItem(options[highlightedIndex]);
      } else if (allowCustom && highlightedIndex === options.length) {
        handleSelectCustom();
      } else if (inputValue.trim()) {
        handleSelectCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderIcon = (item?: AutocompleteItem) => {
    if (item?.logoUrl) {
      return (
        <img
          src={item.logoUrl}
          alt={item.title}
          className="w-6 h-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200 dark:border-dark-border"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    if (iconType === 'institution') {
      return <GraduationCap className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
    }
    if (iconType === 'skill') {
      return <Code className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
    }
    return <Building2 className="w-5 h-5 text-brand-500 flex-shrink-0" />;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
            error
              ? 'border-rose-500 focus:border-rose-500'
              : 'border-slate-200 dark:border-dark-border focus:border-brand-500'
          } rounded-xl text-sm text-light-text dark:text-dark-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all`}
        />
        <div className="absolute left-3 top-3 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        {isLoading && (
          <div className="absolute right-3 top-3 text-brand-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-100 dark:border-dark-border max-h-64 overflow-y-auto py-2 animate-scale-in">
          {options.length > 0 ? (
            options.map((item, idx) => {
              const isSelected = selectedId && item.id === selectedId;
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                      : 'hover:bg-slate-50 dark:hover:bg-dark-elevated text-light-text dark:text-dark-text'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderIcon(item)}
                    <div className="truncate">
                      <p className="text-sm font-semibold leading-snug truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                </div>
              );
            })
          ) : !isLoading ? (
            <div className="px-4 py-3 text-xs text-light-muted dark:text-dark-muted text-center">
              No matching recognized entries found.
            </div>
          ) : null}

          {/* Custom "Other / Not Listed" Option */}
          {allowCustom && (
            <div
              onClick={handleSelectCustom}
              onMouseEnter={() => setHighlightedIndex(options.length)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 border-t border-slate-100 dark:border-dark-border cursor-pointer transition-colors ${
                highlightedIndex === options.length
                  ? 'bg-brand-50/80 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                  : 'hover:bg-slate-50 dark:hover:bg-dark-elevated text-brand-600 dark:text-brand-400'
              }`}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <div className="text-xs font-semibold truncate">
                {inputValue.trim()
                  ? `Use custom: "${inputValue.trim()}"`
                  : customLabel}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
