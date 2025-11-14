import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Country {
  value: string;
  label: string;
  icon: string;
}

interface CountrySelectProps {
  countries: Country[];
  onSelect: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
}

export const CountrySelect = ({ 
  countries, 
  onSelect, 
  defaultValue,
  disabled = false 
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || "");
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedCountry = countries.find((country) => country.value === value);

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);
    onSelect(currentValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-auto min-h-[80px] p-6 border-2 hover:border-primary/50 transition-all"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-4 text-left">
              <span className="text-3xl">{selectedCountry.icon}</span>
              <span className="text-lg font-semibold">{selectedCountry.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select your country...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-card border-2 z-[100] shadow-xl" 
        align="start"
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : '400px' }}
      >
        <Command className="bg-card">
          <CommandInput placeholder="Search country..." className="h-12 bg-card" />
          <CommandList className="max-h-[300px] bg-card">
            <CommandEmpty className="bg-card">No country found.</CommandEmpty>
            <CommandGroup className="bg-card">
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => handleSelect(country.value)}
                  className="cursor-pointer hover:bg-accent py-3 px-4 bg-card"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{country.icon}</span>
                    <span className="flex-1">{country.label}</span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === country.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};