import React, { useState, useEffect, useRef } from "react";

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  fetchSuggestions: (query: string) => Promise<string[]>;
  disabled?: boolean;
  disabledHint?: string;
  error?: string;
  minChars?: number;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder,
  fetchSuggestions,
  disabled = false,
  disabledHint,
  error,
  minChars = 3,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input state when prop value changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside listener to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions when input length >= minChars
  useEffect(() => {
    let isMounted = true;
    const trimmed = inputValue.trim();

    if (disabled || trimmed.length < minChars) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(trimmed);
        if (isMounted) {
          setSuggestions(results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch location suggestions:", err);
        if (isMounted) {
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inputValue, disabled, minChars, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!isOpen && newValue.trim().length >= minChars) {
      setIsOpen(true);
    }
  };

  const handleSelect = (item: string) => {
    setInputValue(item);
    onChange(item);
    setIsOpen(false);
  };

  const trimmedLength = inputValue.trim().length;

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (!disabled && trimmedLength >= minChars && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all ${
            disabled
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : error
              ? "border-red-400 focus:ring-2 focus:ring-red-500 bg-red-50/10 text-slate-800"
              : "border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
          }`}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <svg
              className="animate-spin h-3.5 w-3.5 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {/* Disabled hint message */}
      {disabled && disabledHint && (
        <span className="text-[10px] text-amber-600 font-medium mt-1 block">
          {disabledHint}
        </span>
      )}

      {/* Min char requirement hint when user is typing but under 3 chars */}
      {!disabled && isFocused && trimmedLength > 0 && trimmedLength < minChars && (
        <span className="text-[10px] text-indigo-500 font-medium mt-1 block animate-fade-in">
          Ketik minimal {minChars} huruf untuk menampilkan opsi... ({trimmedLength}/{minChars})
        </span>
      )}

      {/* Error message */}
      {error && (
        <span className="text-red-500 text-[10px] mt-1 block font-semibold">
          {error}
        </span>
      )}

      {/* Scrollable Popup Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-50 animate-scale-up">
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <button
                key={`${item}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{item}</span>
                {inputValue.toLowerCase() === item.toLowerCase() && (
                  <span className="text-indigo-600 text-[10px] font-bold">Terpilih</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3.5 py-3 text-xs text-slate-400 italic text-center">
              Tidak ada hasil yang cocok dengan &quot;{inputValue}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
