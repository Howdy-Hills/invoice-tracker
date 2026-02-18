"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure the worker - use CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedInvoice {
  vendorName: string | null;
  invoiceDate: string | null;
  invoiceNumber: string | null;
  totalAmount: number | null;
  taxAmount: number | null;
  lineItems: ParsedLineItem[];
  rawText: string;
  confidence: number;
}

export interface ParsedLineItem {
  description: string;
  quantity: number;
  unitPrice: number | null;
  amount: number;
  isTax: boolean;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText;
}

export function parseInvoiceText(rawText: string): ParsedInvoice {
  const vendorName = extractVendorName(rawText);
  const invoiceDate = extractInvoiceDate(rawText);
  const invoiceNumber = extractInvoiceNumber(rawText);
  const totalAmount = extractTotal(rawText);
  const taxAmount = extractTax(rawText);
  const lineItems = extractLineItems(rawText);

  let confidencePoints = 0;
  let totalChecks = 5;
  if (vendorName) confidencePoints++;
  if (invoiceDate) confidencePoints++;
  if (invoiceNumber) confidencePoints++;
  if (totalAmount) confidencePoints++;
  if (lineItems.length > 0) confidencePoints++;

  return {
    vendorName,
    invoiceDate,
    invoiceNumber,
    totalAmount,
    taxAmount,
    lineItems,
    rawText,
    confidence: Math.round((confidencePoints / totalChecks) * 100) / 100,
  };
}

function extractVendorName(text: string): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const EMAIL_HEADER = /^(from|to|subject|sent|date|cc|bcc):/i;
  const EMAIL = /\S+@\S+\.\S+/;
  const URL = /https?:\/\/|www\./i;

  for (const line of lines.slice(0, 15)) {
    if (EMAIL_HEADER.test(line)) continue;
    if (EMAIL.test(line)) continue;
    if (URL.test(line)) continue;
    if (line.length < 3 || line.length > 80) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^(invoice|bill|statement|estimate|quote|page)/i.test(line)) continue;
    if (/[a-zA-Z]/.test(line)) return line;
  }
  return null;
}

function extractInvoiceDate(text: string): string | null {
  const LABELED = [
    /(?:invoice\s*date|inv\.?\s*date|billing\s*date|date\s*of\s*invoice)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:invoice\s*date|inv\.?\s*date|billing\s*date|date\s*of\s*invoice)[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(?:^|\s)date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/im,
    /(?:^|\s)date[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/im,
  ];

  for (const pattern of LABELED) {
    const match = text.match(pattern);
    if (match) {
      const parsed = tryParseDate(match[1]);
      if (parsed) return parsed;
    }
  }

  const lines = text.split("\n").slice(0, 20);
  const STANDALONE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  for (const line of lines) {
    if (/\b\d{5}(-\d{4})?\b/.test(line) && /\b(street|st|ave|road|rd|drive|dr|suite|ste|box)\b/i.test(line)) continue;
    if (/phone|fax|tel|cell|mobile/i.test(line)) continue;
    const match = line.match(STANDALONE);
    if (match) {
      const parsed = tryParseDate(match[1]);
      if (parsed) return parsed;
    }
  }
  return null;
}

function tryParseDate(dateStr: string): string | null {
  try {
    // Try MM/DD/YYYY or MM-DD-YYYY
    let match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      let [, m, d, y] = match;
      if (y.length === 2) y = (parseInt(y) > 50 ? "19" : "20") + y;
      const year = parseInt(y);
      const month = parseInt(m);
      const day = parseInt(d);
      if (year < 2000 || year > new Date().getFullYear() + 1) return null;
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Try "Month DD, YYYY" or "Month DD YYYY"
    match = dateStr.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match) {
      const months: Record<string, number> = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
        jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      };
      const monthNum = months[match[1].toLowerCase()];
      if (!monthNum) return null;
      const year = parseInt(match[3]);
      const day = parseInt(match[2]);
      if (year < 2000 || year > new Date().getFullYear() + 1) return null;
      return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  } catch {
    return null;
  }
  return null;
}

function extractInvoiceNumber(text: string): string | null {
  const PATTERNS = [
    /(?:invoice\s*#|invoice\s*no\.?|invoice\s*number|inv\s*#|inv\s*no\.?)[:\s]*([A-Z0-9][\w\-]{1,30})/i,
    /(?:reference\s*#|ref\s*#|ref\s*no\.?)[:\s]*([A-Z0-9][\w\-]{1,30})/i,
    /(?:order\s*#|order\s*no\.?|po\s*#|po\s*no\.?)[:\s]*([A-Z0-9][\w\-]{1,30})/i,
  ];

  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (/^https?/i.test(candidate)) continue;
      if (/@/.test(candidate)) continue;
      if (candidate.length < 2) continue;
      return candidate;
    }
  }
  return null;
}

function extractTotal(text: string): number | null {
  const TOTAL_PATTERNS = [
    /(?:total\s*(?:amount\s*)?due|amount\s*due|balance\s*due|total\s*due)[:\s]*\$?\s?([\d,]+\.\d{2})/i,
    /(?:grand\s*total|total)[:\s]*\$?\s?([\d,]+\.\d{2})/i,
  ];

  const lines = text.split("\n").reverse();

  for (const pattern of TOTAL_PATTERNS) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) return parseFloat(match[1].replace(/,/g, ""));
    }
  }

  const DOLLAR = /\$\s?([\d,]+\.\d{2})/;
  for (const line of lines) {
    const match = line.match(DOLLAR);
    if (match) return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

function extractTax(text: string): number | null {
  const TAX = [/(?:sales\s*tax|tax|hst|gst|vat)[:\s]*\$?\s?([\d,]+\.\d{2})/i];
  for (const pattern of TAX) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

function extractLineItems(text: string): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  const lines = text.split("\n");
  const DOLLAR_LINE = /^(.+?)\s+\$?\s?([\d,]+\.\d{2})\s*$/;
  const SKIP = /^(subtotal|sub-total|total|tax|sales tax|shipping|freight|balance|amount due|payment|discount)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    if (SKIP.test(trimmed)) continue;

    const match = trimmed.match(DOLLAR_LINE);
    if (match) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ""));
      if (description.length < 2 || amount <= 0) continue;

      items.push({
        description,
        quantity: 1,
        unitPrice: amount,
        amount,
        isTax: /\btax\b/i.test(description),
      });
    }
  }
  return items;
}
