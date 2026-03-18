import { useCallback } from "react";
import { maskCurrencyInput } from "@/lib/formatters";

interface CurrencyInputProps {
  value: string;
  onChange: (maskedValue: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  readOnly?: boolean;
  id?: string;
}

/**
 * Input that automatically formats values in Brazilian currency style.
 * Stores the masked string (e.g. "1.586,00") — use parseBRNumber() to get the number.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "input-field",
  required,
  readOnly,
  id,
}: CurrencyInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskCurrencyInput(e.target.value);
      onChange(masked);
    },
    [onChange]
  );

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={handleChange}
      required={required}
      readOnly={readOnly}
    />
  );
}
