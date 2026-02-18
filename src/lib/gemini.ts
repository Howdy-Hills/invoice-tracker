"use server";

/**
 * Gemini AI integration for smart line-item categorisation.
 * This is the OPTIONAL tier — requires a Gemini API key.
 * Uses the free Gemini 2.0 Flash model.
 */

/**
 * Attempt to parse JSON that may be malformed from Gemini.
 * Tries: direct parse, stripping markdown fences, fixing trailing commas,
 * and extracting the first JSON object/array from the text.
 */
function safeJsonParse<T>(text: string): T {
  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // 2. Strip markdown code fences if present
  let cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  // 3. Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // 4. Try parsing cleaned version
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  // 5. Try to extract the first complete JSON object or array
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0].replace(/,\s*([}\]])/g, "$1"));
    } catch {
      // continue
    }
  }

  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0].replace(/,\s*([}\]])/g, "$1"));
    } catch {
      // continue
    }
  }

  throw new Error("Could not parse AI response as JSON");
}

interface GeminiCategorizeInput {
  lineItems: { description: string; amount: number }[];
  categories: string[];
  vendorName?: string | null;
}

interface GeminiCategorizeResult {
  description: string;
  suggestedCategory: string | null;
  confidence: number;
}

/**
 * Call Gemini to categorise line items into budget categories.
 * Returns an array matching the input order.
 */
export async function geminiCategorize(
  apiKey: string,
  input: GeminiCategorizeInput
): Promise<GeminiCategorizeResult[]> {
  const { lineItems, categories, vendorName } = input;

  if (lineItems.length === 0) return [];

  const prompt = buildPrompt(lineItems, categories, vendorName);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const parsed = safeJsonParse<Array<{
      description: string;
      category: string | null;
      confidence: number;
    }>>(text);

    return parsed.map((item, i) => ({
      description: lineItems[i]?.description ?? item.description,
      suggestedCategory:
        item.category && categories.includes(item.category)
          ? item.category
          : null,
      confidence: Math.max(0, Math.min(1, item.confidence ?? 0)),
    }));
  } catch (err) {
    console.error("Gemini categorize failed:", err);
    // Return empty results on failure — don't block the workflow
    return lineItems.map((li) => ({
      description: li.description,
      suggestedCategory: null,
      confidence: 0,
    }));
  }
}

function buildPrompt(
  lineItems: { description: string; amount: number }[],
  categories: string[],
  vendorName?: string | null
): string {
  const itemsList = lineItems
    .map(
      (li, i) =>
        `${i + 1}. "${li.description}" — $${li.amount.toFixed(2)}`
    )
    .join("\n");

  const catList = categories.join(", ");

  return `You are a construction invoice categorisation assistant.

Given the following line items from a construction invoice${vendorName ? ` from vendor "${vendorName}"` : ""},
assign each to the most appropriate budget category.

Available budget categories: ${catList}

Line items:
${itemsList}

For each line item, respond with a JSON array of objects with these fields:
- "description": the original line item description
- "category": the best matching category name from the list above, or null if no good match
- "confidence": a number 0-1 indicating how confident you are

Respond ONLY with the JSON array, no other text.`;
}

/**
 * Parse raw PDF text into structured invoice data using Gemini.
 * This replaces the regex-based parser when an API key is available.
 */
export interface GeminiParsedInvoice {
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  taxAmount: number | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number | null;
    amount: number;
  }[];
}

export async function geminiParseInvoice(
  apiKey: string,
  rawText: string
): Promise<GeminiParsedInvoice> {
  const prompt = `You are an expert at reading construction invoices.

Extract the following from this invoice text. Return a JSON object with these fields:
- "vendorName": the company/person who sent the invoice (string or null)
- "invoiceNumber": the invoice number/reference (string or null)
- "invoiceDate": the invoice date in YYYY-MM-DD format (string or null)
- "totalAmount": the total amount due as a number (number or null)
- "taxAmount": the tax amount as a number (number or null, default 0)
- "lineItems": array of objects, each with:
  - "description": what was purchased/done (string)
  - "quantity": how many (number, default 1)
  - "unitPrice": price per unit (number or null)
  - "amount": total for this line (number)

Extract as many line items as you can find. If the invoice just has a single total with no itemized lines, create one line item with the description and total.

Be thorough - look for vendor name in headers, letterheads, or "Bill From" sections. Look for dates near "Invoice Date", "Date", or at the top of the document.

Respond ONLY with the JSON object, no other text.

Invoice text:
${rawText.slice(0, 6000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ")}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini parse error:", response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = safeJsonParse<GeminiParsedInvoice>(text);

    return {
      vendorName: parsed.vendorName || null,
      invoiceNumber: parsed.invoiceNumber || null,
      invoiceDate: parsed.invoiceDate || null,
      totalAmount: typeof parsed.totalAmount === "number" ? parsed.totalAmount : null,
      taxAmount: typeof parsed.taxAmount === "number" ? parsed.taxAmount : 0,
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((li) => ({
            description: li.description || "Item",
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice ?? null,
            amount: li.amount || 0,
          }))
        : [],
    };
  } catch (err) {
    console.error("Gemini parse failed:", err);
    throw err; // Let caller handle fallback to regex parser
  }
}

/**
 * Suggest the best overall budget category for an invoice.
 * Used by the "Apply to All" feature to pre-select a category.
 */
export interface CategorySuggestion {
  categoryName: string | null;
  confidence: number;
  reason: string;
}

export async function geminiSuggestCategory(
  apiKey: string,
  input: {
    vendorName: string;
    lineDescriptions: string[];
    categoryNames: string[];
  }
): Promise<CategorySuggestion> {
  const { vendorName, lineDescriptions, categoryNames } = input;

  if (categoryNames.length === 0) {
    return { categoryName: null, confidence: 0, reason: "No categories available" };
  }

  const prompt = `You are a construction invoice categorisation assistant.

Given this invoice from vendor "${vendorName || "Unknown"}" with these line items:
${lineDescriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Available budget categories: ${categoryNames.join(", ")}

Which single budget category best fits this ENTIRE invoice? Most construction invoices from a single vendor fall under one category.

Respond with a JSON object:
- "categoryName": the best matching category name from the list above, or null if no good match
- "confidence": a number 0-1 indicating how confident you are
- "reason": a brief explanation (10 words or fewer)

Respond ONLY with the JSON object, no other text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = safeJsonParse<CategorySuggestion>(text);

    // Case-insensitive match to handle Gemini returning slightly different casing
    let matchedName: string | null = null;
    if (parsed.categoryName) {
      const lower = parsed.categoryName.toLowerCase().trim();
      matchedName = categoryNames.find(
        (c) => c.toLowerCase().trim() === lower
      ) || null;
    }

    return {
      categoryName: matchedName,
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)),
      reason: parsed.reason || "",
    };
  } catch (err) {
    console.error("Gemini suggest category failed:", err);
    return { categoryName: null, confidence: 0, reason: "AI suggestion failed" };
  }
}

/**
 * Validate that a Gemini API key works by listing available models.
 * This is lighter than generating content and works with any valid key.
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET" }
    );
    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini key validation failed:", response.status, text);
    }
    return response.ok;
  } catch (err) {
    console.error("Gemini key validation error:", err);
    return false;
  }
}
