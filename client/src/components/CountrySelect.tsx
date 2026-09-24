import React, { useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Singapore', 'United Arab Emirates',
  'Netherlands', 'Sweden', 'Switzerland', 'Brazil', 'South Africa',
  'Spain', 'Italy', 'New Zealand', 'South Korea', 'Ireland'
];

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  error?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-3 py-2 bg-surface2 border ${
          error ? 'border-danger' : 'border-border'
        } rounded-xl text-xs text-textPrimary text-left focus:outline-none focus:border-primary transition`}
      >
        <span>{value || 'Select Country'}</span>
        <ChevronDown className="w-4 h-4 text-textSecondary" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-paper-lg p-2 max-h-60 overflow-y-auto">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-textSecondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:border-primary"
            />
          </div>
          <div role="listbox" className="space-y-0.5">
            {filtered.map((country) => (
              <button
                key={country}
                type="button"
                role="option"
                aria-selected={value === country}
                onClick={() => {
                  onChange(country);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${
                  value === country
                    ? 'bg-primarySoft text-primary font-bold'
                    : 'text-textPrimary hover:bg-surface2'
                }`}
              >
                <span>{country}</span>
                {value === country && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-3 text-center text-xs text-textSecondary">No country found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
