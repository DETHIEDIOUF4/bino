import { useEffect, useRef, useState } from 'react';
import { getPlaceDetails, searchPlaces } from '../services/places';

export default function AddressSearch({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.label || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setQuery(value?.label || '');
  }, [value?.label]);

  const runSearch = async (text) => {
    const list = await searchPlaces(text);
    setSuggestions(list);
    setOpen(list.length > 0);
  };

  const onInput = (text) => {
    setQuery(text);
    clearTimeout(timer.current);
    if (text.trim().length < 2) {
      runSearch(text);
      return;
    }
    timer.current = setTimeout(() => runSearch(text), 300);
  };

  const onFocusInput = () => {
    runSearch(query);
  };

  const pick = async (item) => {
    setQuery(item.description);
    setOpen(false);
    const details = await getPlaceDetails(item.placeId, item);
    if (details) onChange(details);
    else onChange(null);
  };

  return (
    <div className="address-search">
      <label>{label}</label>
      <input
        value={query}
        onChange={(e) => onInput(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocusInput}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button type="button" onMouseDown={() => pick(s)}>
                <strong>{s.mainText}</strong>
                {s.secondaryText && <span>{s.secondaryText}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
