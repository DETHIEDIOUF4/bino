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

  const onInput = (text) => {
    setQuery(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const list = await searchPlaces(text);
      setSuggestions(list);
      setOpen(list.length > 0);
    }, 350);
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
        onFocus={() => suggestions.length && setOpen(true)}
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
      <style>{`
        .address-search { position: relative; display: flex; flex-direction: column; gap: 6px; }
        .address-search label { font-weight: 600; font-size: 0.85rem; }
        .address-search input {
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 1rem;
        }
        .suggestions {
          list-style: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow);
          z-index: 20;
          max-height: 220px;
          overflow: auto;
        }
        .suggestions button {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .suggestions button:hover { background: var(--creme); }
        .suggestions span { font-size: 0.8rem; color: var(--muted); }
      `}</style>
    </div>
  );
}
