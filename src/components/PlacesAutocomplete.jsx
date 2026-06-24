import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const API_KEY = "AIzaSyDBLj3hgiFNaW6-CVBEKLFg9847oUb_TF4";

/**
 * Google Places Autocomplete using the Places API (New) REST endpoint.
 * Dropdown renders via portal to escape overflow:hidden parents.
 */
export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search location...",
  className = "",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Position the dropdown below the input
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (showDropdown) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showDropdown, updatePosition]);

  const fetchSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
          },
          body: JSON.stringify({
            input,
            includedRegionCodes: ["in"],
            languageCode: "en",
          }),
        },
      );
      const data = await res.json();
      console.log("[PlacesAutocomplete] API response:", data);
      const items = (data.suggestions || [])
        .filter((s) => s.placePrediction)
        .map((s) => ({
          placeId: s.placePrediction.placeId,
          mainText:
            s.placePrediction.structuredFormat?.mainText?.text ||
            s.placePrediction.text?.text ||
            "",
          secondaryText:
            s.placePrediction.structuredFormat?.secondaryText?.text || "",
          fullText: s.placePrediction.text?.text || "",
        }));
      console.log("[PlacesAutocomplete] Parsed items:", items);
      setSuggestions(items);
      setShowDropdown(items.length > 0);
    } catch (err) {
      console.error("[PlacesAutocomplete] Fetch error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion) => {
    console.log("[PlacesAutocomplete] Selected:", suggestion.mainText);
    onChange(suggestion.mainText);
    setShowDropdown(false);
    setSuggestions([]);

    if (suggestion.placeId && onPlaceSelect) {
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/places/${suggestion.placeId}`,
          {
            headers: {
              "X-Goog-Api-Key": API_KEY,
              "X-Goog-FieldMask": "displayName,formattedAddress,location",
            },
          },
        );
        const place = await res.json();
        console.log("[PlacesAutocomplete] Place details:", place);
        onPlaceSelect({
          name: place.displayName?.text || suggestion.mainText,
          formattedAddress: place.formattedAddress || suggestion.fullText,
          placeId: suggestion.placeId,
          lat: place.location?.latitude || null,
          lng: place.location?.longitude || null,
        });
      } catch (err) {
        console.error("[PlacesAutocomplete] Details error:", err);
        onPlaceSelect({
          name: suggestion.mainText,
          formattedAddress: suggestion.fullText,
          placeId: suggestion.placeId,
          lat: null,
          lng: null,
        });
      }
    }
  };

  // Render dropdown in a portal to escape modal overflow
  const dropdown =
    showDropdown && suggestions.length > 0
      ? createPortal(
          <div
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
          >
            {loading && (
              <div className="px-4 py-3 text-xs text-gray-400">
                Searching...
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={s.placeId || i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[PlacesAutocomplete] Clicked:", s.mainText);
                  handleSelect(s);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800 truncate">
                  {s.mainText}
                </p>
                {s.secondaryText && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {s.secondaryText}
                  </p>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowDropdown(true);
            updatePosition();
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
}
