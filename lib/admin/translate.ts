import { validationFieldMessages } from "./translations/validation.ts";

type Parameters = Record<string, string | number>;
type Messages = Readonly<Record<string, string>>;
type MessagePattern = {
  expression: RegExp;
  render: (match: RegExpExecArray) => string | undefined;
};

const fieldLabels = new Map(
  Object.entries(validationFieldMessages).map(([label, translated]) => [
    label.toLowerCase(),
    translated,
  ]),
);
const stages: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  confirmed: "নিশ্চিত",
  processing: "প্রস্তুত হচ্ছে",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
  returned: "ফেরত",
};

function fieldPattern(
  expression: RegExp,
  render: (label: string, match: RegExpExecArray) => string,
): MessagePattern {
  return {
    expression,
    render(match) {
      const label = fieldLabels.get(match[1].toLowerCase());
      return label ? render(label, match) : undefined;
    },
  };
}

// Compiled once. Only known validator labels are translated; captured shop data stays intact.
const patterns: MessagePattern[] = [
  fieldPattern(/^(.+) is required\.$/, (label) => `${label} আবশ্যক।`),
  fieldPattern(/^(.+) must be text\.$/, (label) => `${label} লেখা হতে হবে।`),
  fieldPattern(/^(.+) is too long\.$/, (label) => `${label} অনেক বড় হয়েছে।`),
  fieldPattern(
    /^(.+) must be an object\.$/,
    (label) => `${label} একটি অবজেক্ট হতে হবে।`,
  ),
  fieldPattern(
    /^(.+) must be a number\.$/,
    (label) => `${label} একটি সংখ্যা হতে হবে।`,
  ),
  fieldPattern(
    /^(.+) must be (a whole number|a number) between ([\d.-]+) and ([\d.-]+)\.$/,
    (label, match) =>
      `${label} ${match[3]} থেকে ${match[4]}-এর মধ্যে ${match[2] === "a whole number" ? "পূর্ণসংখ্যা" : "সংখ্যা"} হতে হবে।`,
  ),
  fieldPattern(/^Choose a valid (.+)\.$/, (label) => `সঠিক ${label} বেছে নিন।`),
  fieldPattern(
    /^(.+) must be true or false\.$/,
    (label) => `${label} হ্যাঁ অথবা না হতে হবে।`,
  ),
  fieldPattern(
    /^(.+) must be a list of at most 100 values\.$/,
    (label) => `${label} সর্বোচ্চ 100টি মানের তালিকা হতে হবে।`,
  ),
  fieldPattern(
    /^(.+) must be a valid date\.$/,
    (label) => `${label} সঠিক তারিখ হতে হবে।`,
  ),
  fieldPattern(
    /^(.+) must be a local \/images\/ path or an image selected from your device\.$/,
    (label) =>
      `${label} স্থানীয় /images/ পাথ অথবা আপনার ডিভাইস থেকে বাছাই করা ছবি হতে হবে।`,
  ),
  {
    expression: /^Choose a valid variant for (.+)\.$/,
    render: (match) => `${match[1]}-এর সঠিক ভ্যারিয়েন্ট বেছে নিন।`,
  },
  {
    expression: /^Choose a size or color for (.+)\.$/,
    render: (match) => `${match[1]}-এর মাপ অথবা রং বেছে নিন।`,
  },
  {
    expression: /^(.+): this variant is unavailable\.$/,
    render: (match) => `${match[1]}: এই ভ্যারিয়েন্ট পাওয়া যাচ্ছে না।`,
  },
  {
    expression: /^(.+) has only (\d+) units in stock\.$/,
    render: (match) => `${match[1]}-এর মজুতে মাত্র ${match[2]} ইউনিট আছে।`,
  },
  {
    expression: /^(.+): restoring stock would exceed 1,000,000 units\.$/,
    render: (match) =>
      `${match[1]}: মজুত ফেরত যোগ করলে 1,000,000 ইউনিটের সীমা ছাড়াবে।`,
  },
  {
    expression: /^Cannot move an order from (\w+) to (\w+)\.$/,
    render: (match) => {
      const from = Object.hasOwn(stages, match[1])
        ? stages[match[1]]
        : undefined;
      const to = Object.hasOwn(stages, match[2]) ? stages[match[2]] : undefined;
      return from && to
        ? `অর্ডার ${from} থেকে ${to} ধাপে নেওয়া যাবে না।`
        : undefined;
    },
  },
  {
    expression: /^Invalid backup (products|orders|notifications)\.$/,
    render: (match) =>
      `ব্যাকআপের ${{ products: "পণ্য", orders: "অর্ডার", notifications: "নোটিফিকেশন" }[match[1]]} সঠিক নয়।`,
  },
];

function interpolate(message: string, params: Parameters): string {
  return message.replace(/\{(\w+)\}/g, (token, key: string) =>
    Object.hasOwn(params, key) && params[key] !== undefined
      ? String(params[key])
      : token,
  );
}

export function translateMessage(
  english: string,
  language: "en" | "bn",
  messages: Messages,
  params: Parameters = {},
): string {
  if (language === "en") return interpolate(english, params);
  if (Object.hasOwn(messages, english))
    return interpolate(messages[english], params);
  for (const { expression, render } of patterns) {
    const match = expression.exec(english);
    if (!match) continue;
    const translated = render(match);
    if (translated) return interpolate(translated, params);
  }
  return interpolate(english, params);
}
