interface TimeRange {
  id: string;
  label: string;
}

const timeRanges: TimeRange[] = [
  { id: "1d", label: "1 Día" },
  { id: "7d", label: "7 Días" },
  { id: "1m", label: "1 Mes" },
  { id: "custom", label: "Personalizado" },
];

interface TimeRangeTabsProps {
  selectedRange: string;
  onRangeChange: (rangeId: string) => void;
}

const TimeRangeTabs = ({ selectedRange, onRangeChange }: TimeRangeTabsProps) => {
  return (
    <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
      {timeRanges.map((range) => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedRange === range.id
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeTabs;
