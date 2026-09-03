import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CustomDateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onApply: () => void;
}

const CustomDateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: CustomDateRangePickerProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card rounded-xl border border-border animate-fade-in">
      <div className="flex-1">
        <label className="text-xs text-muted-foreground mb-1.5 block">Fecha inicio</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-1">
        <label className="text-xs text-muted-foreground mb-1.5 block">Fecha fin</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {startDate && endDate && (
        <div className="flex items-end">
          <Button 
            className="w-full sm:w-auto"
            onClick={onApply}
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomDateRangePicker;
