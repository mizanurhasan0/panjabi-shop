import test from "node:test";
import assert from "node:assert/strict";
import { translateMessage } from "../lib/admin/translate.ts";
import { validationMessages } from "../lib/admin/translations/validation.ts";

test("language interpolation preserves provided values and unknown tokens", () => {
  const dictionary = {
    "Order {number}: {total} {missing}": "অর্ডার {number}: {total} {missing}",
  };
  assert.equal(
    translateMessage("Order {number}: {total} {missing}", "bn", dictionary, {
      number: "PS-1001",
      total: 0,
    }),
    "অর্ডার PS-1001: 0 {missing}",
  );
  assert.equal(
    translateMessage("Order {number}: {total} {missing}", "en", dictionary, {
      number: "PS-1001",
      total: 0,
    }),
    "Order PS-1001: 0 {missing}",
  );
});

test("unknown messages and prototype names remain unchanged", () => {
  for (const message of [
    "Something new happened.",
    "constructor",
    "toString",
    "Customer's handmade item is required.",
  ]) {
    assert.equal(translateMessage(message, "bn", validationMessages), message);
  }
  assert.equal(
    translateMessage("{constructor}", "bn", {}, {}),
    "{constructor}",
  );
});

test("validation errors translate known labels and preserve numeric constraints", () => {
  assert.equal(
    translateMessage("Customer name is required.", "bn", validationMessages),
    "ক্রেতার নাম আবশ্যক।",
  );
  assert.equal(
    translateMessage(
      "Restock quantity must be a whole number between 1 and 1000000.",
      "bn",
      validationMessages,
    ),
    "নতুন মজুতের পরিমাণ 1 থেকে 1000000-এর মধ্যে পূর্ণসংখ্যা হতে হবে।",
  );
  assert.equal(
    translateMessage(
      "Choose a valid payment status.",
      "bn",
      validationMessages,
    ),
    "সঠিক পেমেন্টের অবস্থা বেছে নিন।",
  );
  assert.equal(
    translateMessage("Enter a valid email address.", "bn", validationMessages),
    "সঠিক ইমেইল ঠিকানা লিখুন।",
  );
});

test("product validation preserves customer-entered product names and amounts", () => {
  const product = "Rahim's Panjabi — Blue (XL)";
  assert.equal(
    translateMessage(
      `${product} has only 12 units in stock.`,
      "bn",
      validationMessages,
    ),
    `${product}-এর মজুতে মাত্র 12 ইউনিট আছে।`,
  );
  assert.equal(
    translateMessage(
      `Choose a valid variant for ${product}.`,
      "bn",
      validationMessages,
    ),
    `${product}-এর সঠিক ভ্যারিয়েন্ট বেছে নিন।`,
  );
  assert.equal(
    translateMessage(
      "Cannot move an order from delivered to pending.",
      "bn",
      validationMessages,
    ),
    "অর্ডার ডেলিভারি সম্পন্ন থেকে অপেক্ষমাণ ধাপে নেওয়া যাবে না।",
  );
  assert.equal(
    translateMessage(
      "Cannot move an order from custom to pending.",
      "bn",
      validationMessages,
    ),
    "Cannot move an order from custom to pending.",
  );
});

test("English validation is unchanged and explicit dictionary entries take precedence", () => {
  const message = "Quantity must be a whole number between 1 and 10000.";
  assert.equal(translateMessage(message, "en", validationMessages), message);
  assert.equal(
    translateMessage(message, "bn", { [message]: "বিশেষ নির্দেশনা" }),
    "বিশেষ নির্দেশনা",
  );
});
