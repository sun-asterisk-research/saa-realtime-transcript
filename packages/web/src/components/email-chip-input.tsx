'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/input';
import { cn } from '@/lib/utils';

interface Profile {
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface EmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function EmailChipInput({ value, onChange, placeholder, label, className }: EmailChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(inputValue)}&limit=10`);
          const data = await res.json();
          setSuggestions(data.users || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddEmail = (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedEmail && !value.includes(normalizedEmail) && emailRegex.test(normalizedEmail)) {
      onChange([...value, normalizedEmail]);
      setInputValue('');
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleAddEmail(suggestions[selectedIndex].email);
      } else if (inputValue) {
        handleAddEmail(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last chip when backspace is pressed on empty input
      onChange(value.slice(0, -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {label && <label className="block text-slate-300 mb-2 text-sm font-medium">{label}</label>}

      <div className="min-h-[42px] w-full rounded-md border border-primary bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary/50">
        {/* Chips Display */}
        <div className="flex flex-wrap gap-2 mb-1">
          {value.map((email) => (
            <div
              key={email}
              className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleRemoveEmail(email)}
                className="hover:text-red-200 transition-colors font-bold"
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={value.length === 0 ? placeholder || 'Type email or name...' : ''}
          className="w-full bg-transparent outline-none text-primary placeholder:text-slate-400"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.email}
              type="button"
              onClick={() => handleAddEmail(user.email)}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-slate-600 flex items-center gap-3 transition-colors',
                index === selectedIndex && 'bg-slate-600',
              )}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
                <div className="text-slate-400 text-xs truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
