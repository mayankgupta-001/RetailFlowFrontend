interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ProductSearchBar({
  value,
  onChange,
  placeholder = "Search by name or category...",
}: ProductSearchBarProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded px-3 py-2 text-sm mb-4"
    />
  );
}