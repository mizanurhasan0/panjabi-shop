import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { generateOrderPdf, generateSpreadsheet } from "../lib/demo/exports.ts";

const settings = {
  name: "পাঞ্জাবি শপ",
  tagline: "",
  logo: "",
  icon: "",
  email: "shop@example.test",
  phone: "01700000000",
  address: "ধানমন্ডি, ঢাকা",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  lowStockThreshold: 5,
};
const item = {
  id: "line",
  productId: null,
  variantId: null,
  title: "সাদা পাঞ্জাবি",
  sku: "00123",
  variant: "সাদা / XL",
  quantity: 2,
  price: 1500,
  costPrice: 800,
  customizations: "হাতার মাপ ২৪ ইঞ্চি।",
};
const order = {
  id: "order",
  number: "PS-1001",
  customerName: "=SUM(1,2)",
  customerPhone: "01700000000",
  customerEmail: "test@example.test",
  address: "মোহাম্মদপুর, ঢাকা\nবাড়ি ১২, রোড ৩",
  notes: "সন্ধ্যায় ডেলিভারি দিন।",
  source: "custom",
  stage: "delivered",
  paymentStatus: "paid",
  paymentMethod: "cod",
  items: [item],
  subtotal: 3000,
  discount: 100,
  shippingCharge: 80,
  deliveryCost: 60,
  additionalCost: 20,
  total: 2980,
  profit: 1300,
  stockDeducted: false,
  history: [
    {
      id: "event",
      stage: "delivered",
      note: "অর্ডার ডেলিভারি হয়েছে।",
      createdAt: "2026-09-08T10:00:00Z",
    },
  ],
  createdAt: "2026-09-08T10:00:00Z",
  updatedAt: "2026-09-08T10:00:00Z",
};

test("order spreadsheets retain customer text safely and reconcile totals", async () => {
  const bytes = await generateSpreadsheet("orders", [order], settings);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet("Orders");
  assert.equal(sheet.getCell("C4").value, "=SUM(1,2)");
  assert.equal(sheet.getCell("C4").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("D4").value, "01700000000");
  assert.equal(sheet.getCell("N4").value, 2980);
  assert.deepEqual(sheet.getCell("N5").value, {
    formula: "SUM(N4:N4)",
    result: 2980,
  });
  assert.deepEqual(sheet.getCell("Q6").value, {
    formula: 'SUMIFS(Q4:Q4,G4:G4,"delivered",H4:H4,"<>refunded")',
    result: 1300,
  });
  assert.equal(sheet.views[0].ySplit, 3);
  assert.equal(
    workbook.getWorksheet("Order items").getCell("H4").value.result,
    3000,
  );
});

test("delivered summary excludes refunded orders while preserving all exported rows", async () => {
  const records = [
    order,
    {
      ...order,
      id: "refunded",
      number: "PS-1002",
      paymentStatus: "refunded",
      total: 2100,
      profit: 900,
    },
    {
      ...order,
      id: "pending",
      number: "PS-1003",
      stage: "pending",
      total: 1600,
      profit: 800,
    },
    {
      ...order,
      id: "unpaid-delivery",
      number: "PS-1004",
      paymentStatus: "unpaid",
      total: 500,
      profit: 200,
    },
  ];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    await generateSpreadsheet("orders", records, settings),
  );
  const sheet = workbook.getWorksheet("Orders");
  assert.equal(sheet.getCell("H5").value, "refunded");
  assert.equal(sheet.getCell("N8").value.result, 7180);
  assert.deepEqual(sheet.getCell("N9").value, {
    formula: 'SUMIFS(N4:N7,G4:G7,"delivered",H4:H7,"<>refunded")',
    result: 3480,
  });
  assert.deepEqual(sheet.getCell("Q9").value, {
    formula: 'SUMIFS(Q4:Q7,G4:G7,"delivered",H4:H7,"<>refunded")',
    result: 1500,
  });
});

test("empty exports contain a valid zero total instead of an inverted SUM range", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await generateSpreadsheet("products", [], settings));
  assert.equal(workbook.getWorksheet("Products").getCell("I4").value, 0);
});

test("Bengali invoices embed a font and paginate long customized orders", async (context) => {
  const font = await readFile(
    new URL("../public/fonts/NotoSansBengali.ttf", import.meta.url),
  );
  context.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/fonts/NotoSansBengali.ttf");
    return new Response(font, { headers: { "Content-Type": "font/ttf" } });
  });
  const bytes = await generateOrderPdf(
    {
      ...order,
      customerName: "মোঃ আব্দুর রহমান",
      items: Array.from({ length: 24 }, (_, index) => ({
        ...item,
        id: String(index),
        customizations: item.customizations.repeat(6),
      })),
    },
    settings,
  );
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() > 1);
  assert.equal(document.getTitle(), "Order PS-1001");
  for (const page of document.getPages()) {
    assert.ok(Math.abs(page.getWidth() - 595.28) < 1);
    assert.ok(Math.abs(page.getHeight() - 841.89) < 1);
  }
});
