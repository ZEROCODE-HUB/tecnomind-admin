import { DateRange } from "react-day-picker";
import DateRangeFilter from "./DateRangeFilter";

export type FilterType = "todos" | "ingresos" | "egresos" | "fechas";

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const filters: { id: FilterType; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ingresos", label: "Ingresos" },
  { id: "egresos", label: "Egresos" },
];

const FilterChips = ({
  activeFilter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
}: FilterChipsProps) => {
  const handleClearDateFilter = () => {
    onDateRangeChange?.(undefined);
    if (activeFilter === "fechas") {
      onFilterChange("todos");
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onDateRangeChange?.(range);
    if (range?.from) {
      onFilterChange("fechas");
    }
  };

  return (
    <div className="flex gap-1.5 px-4 overflow-x-auto pb-2 items-center scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-full px-3 transition-all active:scale-95 ${
            activeFilter === filter.id
              ? "bg-accent text-accent-foreground shadow-md font-bold"
              : "bg-muted border border-border hover:border-accent/30 hover:bg-muted/80 text-muted-foreground hover:text-accent font-medium"
          }`}
        >
          <span className="text-sm leading-normal">{filter.label}</span>
        </button>
      ))}
      <DateRangeFilter
        isActive={activeFilter === "fechas"}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onClear={handleClearDateFilter}
      />
    </div>
  );
};

export default FilterChips;
