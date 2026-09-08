export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function record(
  value: unknown,
  label = "Input",
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function textValue(
  value: unknown,
  label: string,
  options: { required?: boolean; max?: number } = {},
): string {
  if (value === undefined || value === null) {
    if (options.required) throw new ValidationError(`${label} is required.`);
    return "";
  }
  if (typeof value !== "string")
    throw new ValidationError(`${label} must be text.`);
  const result = value.trim();
  if (options.required && !result)
    throw new ValidationError(`${label} is required.`);
  if (result.length > (options.max ?? 1000))
    throw new ValidationError(`${label} is too long.`);
  return result;
}

export function numberValue(
  value: unknown,
  label: string,
  options: {
    fallback?: number;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {},
): number {
  if (value === undefined || value === null || value === "") {
    if (options.fallback !== undefined) return options.fallback;
    throw new ValidationError(`${label} is required.`);
  }
  if (typeof value !== "number" && typeof value !== "string")
    throw new ValidationError(`${label} must be a number.`);
  const result = typeof value === "number" ? value : Number(value);
  if (
    !Number.isFinite(result) ||
    result < (options.min ?? 0) ||
    result > (options.max ?? 100_000_000) ||
    (options.integer && !Number.isInteger(result))
  ) {
    throw new ValidationError(
      `${label} must be ${options.integer ? "a whole number" : "a number"} between ${options.min ?? 0} and ${options.max ?? 100_000_000}.`,
    );
  }
  return result;
}

export function money(
  value: unknown,
  label: string,
  fallback?: number,
): number {
  return (
    Math.round(
      (numberValue(value, label, { fallback, max: 10_000_000 }) +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

export function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
  fallback?: T,
): T {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "string" || !values.includes(value as T))
    throw new ValidationError(`Choose a valid ${label.toLowerCase()}.`);
  return value as T;
}

export function booleanValue(
  value: unknown,
  label: string,
  fallback: boolean,
): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean")
    throw new ValidationError(`${label} must be true or false.`);
  return value;
}

export function textList(
  value: unknown,
  label: string,
  fallback: string[] = [],
): string[] {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > 100)
    throw new ValidationError(`${label} must be a list of at most 100 values.`);
  return [
    ...new Set(
      value
        .map((entry) => textValue(entry, label, { max: 300 }))
        .filter(Boolean),
    ),
  ];
}

export function emailValue(value: unknown): string {
  const email = textValue(value, "Email", { max: 254 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError("Enter a valid email address.");
  return email;
}

export function pagination(
  page?: unknown,
  pageSize?: unknown,
): { page: number; pageSize: number; offset: number } {
  const currentPage = numberValue(page, "Page", {
    fallback: 1,
    min: 1,
    integer: true,
    max: 1_000_000,
  });
  const size = numberValue(pageSize, "Page size", {
    fallback: 20,
    min: 1,
    integer: true,
    max: 100,
  });
  return {
    page: currentPage,
    pageSize: size,
    offset: (currentPage - 1) * size,
  };
}
