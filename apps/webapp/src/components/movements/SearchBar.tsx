import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="px-4 py-3">
      <label className="flex flex-col w-full">
        <div className="flex w-full items-center rounded-xl h-12 bg-muted border border-border focus-within:border-accent/50 transition-all group shadow-sm">
          <div className="text-muted-foreground flex items-center justify-center pl-4 pr-2 group-focus-within:text-accent transition-colors">
            <Search className="size-5" />
          </div>
          <input
            className="flex w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 text-base font-normal focus:outline-none h-full rounded-r-xl pr-4"
            placeholder="Buscar por nombre, fecha o monto"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </label>
    </div>
  );
};

export default SearchBar;
