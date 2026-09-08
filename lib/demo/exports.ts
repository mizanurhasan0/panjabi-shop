import "regenerator-runtime/runtime.js";
import type ExcelJS from "exceljs";
import type { PDFFont, PDFPage } from "pdf-lib";
import type { AdminProduct, Order, ShopSettings } from "../admin/types";

const ORANGE = "FF8B21";
const DARK = "232323";
const MONEY_FORMAT = '"BDT "#,##0.00;[Red]("BDT "#,##0.00)';
const amount = (value: number) =>
  `BDT ${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));

function sheet(
  workbook: ExcelJS.Workbook,
  name: string,
  title: string,
  columns: Array<{
    header: string;
    key: string;
    width: number;
    money?: boolean;
  }>,
): ExcelJS.Worksheet {
  const result = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { defaultRowHeight: 22 },
  });
  result.columns = columns.map((column) => ({
    key: column.key,
    width: column.width,
    style: column.money ? { numFmt: MONEY_FORMAT } : {},
  }));
  result.mergeCells(1, 1, 1, columns.length);
  result.getCell(1, 1).value = title;
  result.getCell(1, 1).font = { size: 18, bold: true, color: { argb: DARK } };
  result.getRow(1).height = 34;
  result.mergeCells(2, 1, 2, columns.length);
  result.getCell(2, 1).value =
    `Exported ${dateLabel(new Date().toISOString())} (Asia/Dhaka). Amounts in BDT.`;
  result.getCell(2, 1).font = { size: 10, color: { argb: "727272" } };
  const header = result.getRow(3);
  columns.forEach((column, index) => {
    header.getCell(index + 1).value = column.header;
  });
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  result.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: columns.length },
  };
  return result;
}

function finishSheet(worksheet: ExcelJS.Worksheet): void {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return;
    row.alignment = { vertical: "top", wrapText: true };
    let lines = 1;
    row.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: DARK } };
      if (rowNumber % 2 === 0)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF7EE" },
        };
      if (typeof cell.value === "string") {
        const width = worksheet.getColumn(cell.col).width || 15;
        lines = Math.max(
          lines,
          ...cell.value
            .split("\n")
            .map((line) => Math.ceil(line.length / Math.max(1, width - 2))),
        );
      }
    });
    row.height = Math.min(409, Math.max(22, lines * 15));
  });
  worksheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:3",
  };
}

function sumCell(
  worksheet: ExcelJS.Worksheet,
  row: number,
  column: number,
  lastDataRow: number,
  result: number,
): void {
  const letter = worksheet.getColumn(column).letter;
  worksheet.getCell(row, column).value =
    lastDataRow >= 4
      ? { formula: `SUM(${letter}4:${letter}${lastDataRow})`, result }
      : 0;
  worksheet.getCell(row, column).numFmt = MONEY_FORMAT;
}

export async function generateSpreadsheet(
  type: "orders" | "products",
  records: Order[] | AdminProduct[],
  settings: ShopSettings,
): Promise<Uint8Array<ArrayBuffer>> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.name;
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  if (type === "orders") {
    const orders = records as Order[];
    const ordersSheet = sheet(workbook, "Orders", `${settings.name} - Orders`, [
      { header: "Order", key: "number", width: 18 },
      { header: "Created (Dhaka)", key: "createdAt", width: 24 },
      { header: "Customer", key: "customerName", width: 26 },
      { header: "Phone", key: "customerPhone", width: 20 },
      { header: "Email", key: "customerEmail", width: 28 },
      { header: "Address", key: "address", width: 42 },
      { header: "Stage", key: "stage", width: 16 },
      { header: "Payment", key: "paymentStatus", width: 15 },
      { header: "Method", key: "paymentMethod", width: 14 },
      { header: "Source", key: "source", width: 14 },
      { header: "Subtotal", key: "subtotal", width: 20, money: true },
      { header: "Discount", key: "discount", width: 18, money: true },
      {
        header: "Shipping charge",
        key: "shippingCharge",
        width: 20,
        money: true,
      },
      { header: "Total", key: "total", width: 20, money: true },
      { header: "Delivery cost", key: "deliveryCost", width: 20, money: true },
      { header: "Other cost", key: "additionalCost", width: 20, money: true },
      { header: "Order profit", key: "profit", width: 20, money: true },
      { header: "Notes", key: "notes", width: 42 },
    ]);
    for (const order of orders) {
      // ExcelJS writes strings as text cells, so user-supplied =/+/@ text is never a formula.
      const row = ordersSheet.addRow({
        ...order,
        createdAt: new Date(
          new Date(order.createdAt).getTime() + 6 * 60 * 60 * 1000,
        ),
      });
      row.getCell(2).numFmt = "yyyy-mm-dd hh:mm";
      row.getCell(4).numFmt = "@";
    }
    const lastDataRow = ordersSheet.lastRow?.number || 3;
    const totals = ordersSheet.addRow({ number: "Total order value" });
    for (const [column, key] of [
      [11, "subtotal"],
      [12, "discount"],
      [13, "shippingCharge"],
      [14, "total"],
      [15, "deliveryCost"],
      [16, "additionalCost"],
      [17, "profit"],
    ] as const)
      sumCell(
        ordersSheet,
        totals.number,
        column,
        lastDataRow,
        orders.reduce((sum, order) => sum + order[key], 0),
      );
    const delivered = ordersSheet.addRow({
      number: "Delivered excluding refunds",
    });
    for (const [column, key] of [
      [14, "total"],
      [17, "profit"],
    ] as const) {
      const letter = ordersSheet.getColumn(column).letter;
      delivered.getCell(column).value =
        lastDataRow >= 4
          ? {
              formula: `SUMIFS(${letter}4:${letter}${lastDataRow},G4:G${lastDataRow},"delivered",H4:H${lastDataRow},"<>refunded")`,
              result: orders
                .filter(
                  (order) =>
                    order.stage === "delivered" &&
                    order.paymentStatus !== "refunded",
                )
                .reduce((sum, order) => sum + order[key], 0),
            }
          : 0;
    }
    finishSheet(ordersSheet);
    const itemsSheet = sheet(
      workbook,
      "Order items",
      `${settings.name} - Order items`,
      [
        { header: "Order", key: "orderNumber", width: 18 },
        { header: "Product", key: "title", width: 40 },
        { header: "SKU", key: "sku", width: 22 },
        { header: "Variant", key: "variant", width: 24 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Unit price", key: "price", width: 20, money: true },
        { header: "Unit cost", key: "costPrice", width: 20, money: true },
        { header: "Line total", key: "lineTotal", width: 20, money: true },
        { header: "Customization", key: "customizations", width: 48 },
      ],
    );
    for (const order of orders)
      for (const item of order.items) {
        const row = itemsSheet.addRow({ ...item, orderNumber: order.number });
        row.getCell(8).value = {
          formula: `E${row.number}*F${row.number}`,
          result: item.quantity * item.price,
        };
        row.getCell(3).numFmt = "@";
      }
    finishSheet(itemsSheet);
  } else {
    const products = records as AdminProduct[];
    const productsSheet = sheet(
      workbook,
      "Products",
      `${settings.name} - Inventory`,
      [
        { header: "Product ID", key: "id", width: 38 },
        { header: "Title", key: "title", width: 42 },
        { header: "Handle", key: "handle", width: 32 },
        { header: "Category", key: "productType", width: 22 },
        { header: "Selling price", key: "price", width: 20, money: true },
        { header: "Cost price", key: "costPrice", width: 20, money: true },
        { header: "Stock", key: "stock", width: 12 },
        { header: "Low stock threshold", key: "lowStockThreshold", width: 22 },
        { header: "Inventory cost", key: "stockValue", width: 22, money: true },
        { header: "Active", key: "active", width: 12 },
        { header: "Sizes", key: "sizes", width: 22 },
        { header: "Colors", key: "colors", width: 24 },
        { header: "Updated (Dhaka)", key: "updatedAt", width: 24 },
      ],
    );
    for (const product of products) {
      const row = productsSheet.addRow({
        ...product,
        sizes: product.sizes.join(", "),
        colors: product.colors.join(", "),
        active: product.active ? "Yes" : "No",
        updatedAt: new Date(
          new Date(product.updatedAt).getTime() + 6 * 60 * 60 * 1000,
        ),
      });
      row.getCell(9).value = {
        formula: `F${row.number}*G${row.number}`,
        result: product.costPrice * product.stock,
      };
      row.getCell(13).numFmt = "yyyy-mm-dd hh:mm";
    }
    const lastDataRow = productsSheet.lastRow?.number || 3;
    const totals = productsSheet.addRow({ title: "Total inventory cost" });
    sumCell(
      productsSheet,
      totals.number,
      9,
      lastDataRow,
      products.reduce(
        (sum, product) => sum + product.costPrice * product.stock,
        0,
      ),
    );
    finishSheet(productsSheet);
  }
  for (const worksheet of workbook.worksheets) {
    const last = worksheet.lastRow;
    if (last)
      last.eachCell((cell) => {
        cell.border = { top: { style: "thin", color: { argb: ORANGE } } };
      });
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

let fontBytes: Promise<ArrayBuffer> | undefined;
function invoiceFont(): Promise<ArrayBuffer> {
  fontBytes ??= fetch("/fonts/NotoSansBengali.ttf")
    .then((response) => {
      if (!response.ok)
        throw new Error(
          "The invoice font could not load. Please try the download again.",
        );
      return response.arrayBuffer();
    })
    .catch((error) => {
      fontBytes = undefined;
      throw error;
    });
  return fontBytes;
}

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\t/g, " ");
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
  for (const paragraph of cleanText(text).split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const { segment } of segmenter.segment(word)) {
        if (line && font.widthOfTextAtSize(line + segment, size) > width) {
          lines.push(line);
          line = "";
        }
        line += segment;
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

export async function generateOrderPdf(
  order: Order,
  settings: ShopSettings,
): Promise<Uint8Array<ArrayBuffer>> {
  // Load export libraries only after the owner requests a download.
  const [{ PDFDocument, rgb }, { default: fontkit }, bytes] = await Promise.all(
    [import("pdf-lib"), import("@pdf-lib/fontkit"), invoiceFont()],
  );
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const font = await document.embedFont(bytes, { subset: true });
  const textColor = rgb(0.137, 0.137, 0.137);
  const muted = rgb(0.43, 0.43, 0.43);
  const accent = rgb(1, 0.545, 0.129);
  const pale = rgb(1, 0.967, 0.936);
  const width = 595.28,
    height = 841.89,
    margin = 40,
    contentWidth = width - margin * 2;
  let page!: PDFPage;
  let y = 0;
  const draw = (
    text: string,
    x: number,
    baseline: number,
    size = 10,
    color = textColor,
  ) => page.drawText(cleanText(text), { x, y: baseline, size, font, color });
  const right = (text: string, edge: number, baseline: number, size = 10) =>
    draw(text, edge - font.widthOfTextAtSize(text, size), baseline, size);
  const addPage = () => {
    page = document.addPage([width, height]);
    y = height - 45;
    page.drawRectangle({
      x: 0,
      y: height - 7,
      width,
      height: 7,
      color: accent,
    });
    const title = wrapText(settings.name, font, 19, 330);
    title.forEach((line) => {
      draw(line, margin, y, 19);
      y -= 25;
    });
    right(order.number, width - margin, height - 45, 11);
    draw("ORDER INVOICE", margin, y, 9, muted);
    y -= 28;
  };
  const ensure = (space: number) => {
    if (y - space < 55) addPage();
  };
  const block = (label: string, value: string, size = 10) => {
    if (!value) return;
    const lines = wrapText(
      `${label ? `${label}: ` : ""}${value}`,
      font,
      size,
      contentWidth,
    );
    for (const line of lines) {
      ensure(17);
      draw(line, margin, y, size);
      y -= 16;
    }
  };
  addPage();
  block("", [settings.phone, settings.email].filter(Boolean).join("  |  "), 9);
  block("", settings.address, 9);
  y -= 8;
  block("Date", `${dateLabel(order.createdAt)} (Asia/Dhaka)`);
  block(
    "Status",
    `${order.stage}   /   Payment: ${order.paymentStatus} (${order.paymentMethod.toUpperCase()})`,
  );
  y -= 8;
  ensure(24);
  draw("CUSTOMER", margin, y, 9, muted);
  y -= 18;
  block("", order.customerName, 12);
  block("Phone", order.customerPhone);
  block("Email", order.customerEmail);
  block("Address", order.address);
  y -= 14;

  const tableHeader = () => {
    ensure(42);
    page.drawRectangle({
      x: margin,
      y: y - 7,
      width: contentWidth,
      height: 25,
      color: pale,
    });
    draw("ITEM", margin + 8, y, 9);
    right("QTY", 361, y, 9);
    right("UNIT PRICE", 450, y, 9);
    right("TOTAL", width - margin - 8, y, 9);
    y -= 27;
  };
  tableHeader();
  for (const [index, item] of order.items.entries()) {
    const details = [
      `${index + 1}. ${item.title}`,
      item.variant,
      item.sku ? `SKU: ${item.sku}` : "",
      item.customizations ? `Customization: ${item.customizations}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const lines = wrapText(details, font, 9.5, 284);
    const rowHeight = lines.length * 15 + 26;
    if (rowHeight < height - 180 && y - rowHeight < 55) {
      addPage();
      tableHeader();
    }
    let lineIndex = 0;
    while (lineIndex < lines.length) {
      if (y - 24 < 55) {
        addPage();
        tableHeader();
      }
      const capacity = Math.max(1, Math.floor((y - 65) / 15));
      const chunk = lines.slice(lineIndex, lineIndex + capacity);
      if (lineIndex === 0) {
        right(String(item.quantity), 361, y, 9.5);
        right(item.price.toFixed(2), 450, y, 9.5);
        right(
          (item.quantity * item.price).toFixed(2),
          width - margin - 8,
          y,
          9.5,
        );
      }
      for (const line of chunk) {
        draw(line, margin + 8, y, 9.5);
        y -= 15;
      }
      lineIndex += chunk.length;
      if (lineIndex < lines.length) {
        addPage();
        tableHeader();
      }
    }
    y -= 7;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      color: rgb(0.9, 0.9, 0.9),
      thickness: 0.5,
    });
    y -= 19;
  }

  ensure(122);
  for (const [label, value] of [
    ["Subtotal", order.subtotal],
    ["Discount", -order.discount],
    ["Delivery charge", order.shippingCharge],
  ] as const) {
    draw(label, 315, y, 10);
    right(amount(value), width - margin - 8, y, 10);
    y -= 20;
  }
  y -= 10;
  page.drawRectangle({
    x: 305,
    y: y - 10,
    width: width - margin - 305,
    height: 32,
    color: pale,
  });
  draw("TOTAL", 315, y, 12);
  right(amount(order.total), width - margin - 8, y, 12);
  y -= 40;
  if (order.notes) {
    block("Order notes", order.notes);
    y -= 12;
  }
  ensure(38);
  draw("ORDER HISTORY", margin, y, 9, muted);
  y -= 20;
  for (const event of order.history) {
    block(
      "",
      `${dateLabel(event.createdAt)} - ${event.stage}${event.note ? `: ${event.note}` : ""}`,
      9,
    );
    y -= 3;
  }
  y -= 8;
  block("", "Thank you for shopping with us.", 10);
  const pages = document.getPages();
  pages.forEach((invoicePage, index) => {
    invoicePage.drawLine({
      start: { x: margin, y: 37 },
      end: { x: width - margin, y: 37 },
      color: rgb(0.9, 0.9, 0.9),
      thickness: 0.5,
    });
    invoicePage.drawText(`Amounts in BDT  |  ${order.number}`, {
      x: margin,
      y: 23,
      size: 8,
      font,
      color: muted,
    });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    invoicePage.drawText(pageLabel, {
      x: width - margin - font.widthOfTextAtSize(pageLabel, 8),
      y: 23,
      size: 8,
      font,
      color: muted,
    });
  });
  document.setTitle(`Order ${order.number}`);
  document.setAuthor(settings.name);
  document.setSubject("Order invoice");
  return new Uint8Array(await document.save());
}
