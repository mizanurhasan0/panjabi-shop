import { Fragment } from "react";
import { formatPrice } from "@/lib/utils/products";
import styles from "../CollectionFilters.module.css";

interface PriceFilterProps {
  min: number | null;
  max: number | null;
  bounds: { min: number; max: number };
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export function PriceFilter({
  min,
  max,
  bounds,
  onMinChange,
  onMaxChange,
}: PriceFilterProps) {
  const lower = min ?? bounds.min;
  const upper = max ?? bounds.max;
  const clamp = (value: number) =>
    Math.max(bounds.min, Math.min(bounds.max, value));
  const fields = [
    {
      label: "Minimum price",
      value: lower,
      selected: min,
      min: bounds.min,
      max: upper,
      onChange: onMinChange,
      constrain: (value: number) => Math.min(value, upper),
    },
    {
      label: "Maximum price",
      value: upper,
      selected: max,
      min: lower,
      max: bounds.max,
      onChange: onMaxChange,
      constrain: (value: number) => Math.max(value, lower),
    },
  ];

  return (
    <div className={styles.priceFilter}>
      <div className={styles.priceInputs}>
        {fields.map((field, index) => (
          <Fragment key={field.label}>
            {index > 0 && <span aria-hidden="true">-</span>}
            <input
              aria-label={field.label}
              type="number"
              min={field.min}
              max={field.max}
              value={field.value}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              onBlur={() =>
                field.onChange(
                  field.selected === null
                    ? null
                    : field.constrain(clamp(field.value)),
                )
              }
            />
          </Fragment>
        ))}
      </div>
      <div className={styles.rangeInputs}>
        {fields.map((field) => (
          <input
            key={field.label}
            aria-label={`${field.label} slider`}
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={clamp(field.value)}
            onChange={(event) =>
              field.onChange(field.constrain(Number(event.target.value)))
            }
          />
        ))}
      </div>
      <div className={styles.priceLabels}>
        {fields.map((field) => (
          <span key={field.label}>{formatPrice(field.value)}</span>
        ))}
      </div>
    </div>
  );
}
