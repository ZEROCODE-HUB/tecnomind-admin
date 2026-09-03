import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  isActive: boolean;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClear: () => void;
}

const DateRangeFilter = ({
  isActive,
  dateRange,
  onDateRangeChange,
  onClear,
}: DateRangeFilterProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    // Auto-close when a complete range is selected
    if (range?.from && range?.to) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM", { locale: es })}`;
    }
    if (dateRange?.from) {
      return format(dateRange.from, "dd MMM yyyy", { locale: es });
    }
    return "Fechas";
  };

  const calendarContent = (
    <div className="flex flex-col gap-4">
      <CalendarComponent
        mode="range"
        selected={dateRange}
        onSelect={handleSelect}
        numberOfMonths={1}
        locale={es}
        className={cn(
          "p-3 pointer-events-auto",
          "[&_.rdp-day]:transition-all [&_.rdp-day]:duration-200",
          "[&_.rdp-day:hover]:bg-[#2F80ED]/20 [&_.rdp-day:hover]:text-[#0A2540]",
          "[&_.rdp-day_button]:text-[#0A2540]",
          "[&_.rdp-day_button.rdp-day_selected]:bg-[#2F80ED] [&_.rdp-day_button.rdp-day_selected]:text-white",
          "[&_.rdp-day_range_middle]:bg-[#2F80ED]/20",
          "[&_.rdp-caption_label]:text-[#0A2540] [&_.rdp-caption_label]:font-semibold",
          "[&_.rdp-head_cell]:text-[#0A2540]/60"
        )}
        classNames={{
          day_selected: "bg-[#2F80ED] text-white hover:bg-[#2F80ED] hover:text-white focus:bg-[#2F80ED] focus:text-white",
          day_range_start: "bg-[#2F80ED] text-white rounded-l-md",
          day_range_end: "bg-[#2F80ED] text-white rounded-r-md",
          day_range_middle: "bg-[#2F80ED]/20 text-[#0A2540]",
          day_today: "border border-[#2F80ED] text-[#2F80ED]",
        }}
      />
      {dateRange?.from && (
        <div className="flex gap-2 px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1 border-[#0A2540]/20 text-[#0A2540] hover:bg-[#0A2540]/5"
          >
            Limpiar
          </Button>
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
            className="flex-1 bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );

  const triggerButton = (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        "flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-full px-3 transition-all active:scale-95",
        isActive
          ? "bg-accent text-accent-foreground shadow-md font-bold"
          : "bg-muted border border-border hover:border-accent/30 hover:bg-muted/80 text-muted-foreground hover:text-accent font-medium"
      )}
    >
      <span className="text-sm leading-normal whitespace-nowrap">{getButtonLabel()}</span>
      <Calendar className="size-4" />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-[#0A2540]">Filtrar por fechas</SheetTitle>
            </SheetHeader>
            {calendarContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover border border-border shadow-lg"
        align="start"
        sideOffset={8}
      >
        {calendarContent}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
