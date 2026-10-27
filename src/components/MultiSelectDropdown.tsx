import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'All',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClear = () => {
    onChange([]);
  };

  const hasSelections = selected.length > 0;

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={containerRef}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:min-w-[130px] flex items-center justify-between gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border text-left min-h-[42px] transition-all bg-white cursor-pointer ${
          hasSelections
            ? 'border-[#206542] text-[#206542] bg-[#E8F0EC]'
            : 'border-[#CBD5E1] text-black hover:border-[#206542]'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[130px]">
          {hasSelections ? (
            <span>
              {selected.length === 1 ? selected[0] : `${selected.length} selected`}
            </span>
          ) : (
            <span className="text-[#64748B]">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {hasSelections && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-[#CBD5E1] rounded text-[#206542]"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 mt-1.5 w-64 max-w-[90vw] bg-white rounded-md shadow-xl border border-[#CBD5E1] z-50 py-2">
          {/* Search box */}
          <div className="px-2.5 pb-2 border-b border-[#E2E8F0]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label}...`}
                className="w-full pl-8 pr-2 py-1.5 text-xs rounded border border-[#CBD5E1] focus:outline-none focus:border-[#206542]"
                autoFocus
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-[11px] pt-2 text-[#206542] font-semibold">
              <button
                type="button"
                onClick={handleSelectAll}
                className="hover:underline cursor-pointer"
              >
                Select all ({options.length})
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-[#64748B] hover:text-black hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto px-1 py-1 space-y-0.5 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-3 text-[#64748B]">No results found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F0EC] text-[#206542] font-bold'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#206542] border-[#206542] text-white'
                          : 'border-[#CBD5E1]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
