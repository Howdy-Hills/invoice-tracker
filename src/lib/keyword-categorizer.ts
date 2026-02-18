/**
 * Keyword-based categorizer for construction invoice line items.
 * Maps line-item descriptions to budget categories using keyword scoring.
 * This is the FREE tier — always runs, no API key needed.
 */

export interface CategoryMatch {
  categoryName: string;
  confidence: number; // 0–1
}

// Keyword dictionary keyed by category name.
// Each category has an array of [keyword/phrase, weight] tuples.
// Weight range: 1 (weak signal) – 5 (very strong).
const KEYWORD_MAP: Record<string, [string, number][]> = {
  "General Conditions": [
    ["general conditions", 5],
    ["project management", 4],
    ["supervision", 3],
    ["temporary facilities", 4],
    ["job trailer", 4],
    ["porta potty", 4],
    ["porta john", 4],
    ["portable toilet", 4],
    ["dumpster", 3],
    ["waste removal", 3],
    ["debris removal", 3],
    ["cleanup", 2],
    ["safety equipment", 3],
    ["signage", 2],
    ["barricade", 2],
    ["scaffolding", 3],
    ["scaffold rental", 4],
    ["crane rental", 3],
    ["equipment rental", 2],
    ["tool rental", 2],
    ["construction fence", 3],
    ["temp fence", 3],
  ],
  "Site Work": [
    ["site work", 5],
    ["sitework", 5],
    ["excavation", 5],
    ["excavating", 5],
    ["grading", 4],
    ["backfill", 4],
    ["fill dirt", 4],
    ["topsoil", 3],
    ["demolition", 4],
    ["demo", 2],
    ["clearing", 3],
    ["land clearing", 5],
    ["tree removal", 4],
    ["stump removal", 4],
    ["paving", 3],
    ["asphalt", 4],
    ["concrete drive", 4],
    ["driveway", 3],
    ["retaining wall", 3],
    ["erosion control", 4],
    ["silt fence", 4],
    ["gravel", 2],
    ["compaction", 3],
    ["survey", 3],
    ["surveying", 4],
    ["septic", 4],
    ["septic system", 5],
    ["well drilling", 4],
    ["utility trench", 4],
  ],
  Foundation: [
    ["foundation", 5],
    ["footing", 5],
    ["footings", 5],
    ["slab", 4],
    ["concrete slab", 5],
    ["concrete pour", 4],
    ["concrete pump", 4],
    ["rebar", 4],
    ["reinforcement", 3],
    ["formwork", 4],
    ["form boards", 4],
    ["anchor bolt", 4],
    ["pier", 3],
    ["piling", 4],
    ["crawl space", 3],
    ["basement", 3],
    ["waterproofing", 3],
    ["foundation drain", 4],
    ["vapor barrier", 3],
    ["concrete block", 3],
    ["cmu", 4],
    ["masonry", 3],
  ],
  Framing: [
    ["framing", 5],
    ["lumber", 4],
    ["stud", 3],
    ["studs", 3],
    ["joist", 4],
    ["joists", 4],
    ["rafter", 4],
    ["rafters", 4],
    ["truss", 5],
    ["trusses", 5],
    ["sheathing", 4],
    ["plywood", 3],
    ["osb", 3],
    ["header", 2],
    ["beam", 3],
    ["lvl beam", 5],
    ["glulam", 5],
    ["subfloor", 4],
    ["floor joist", 5],
    ["wall framing", 5],
    ["rough framing", 5],
    ["nail", 2],
    ["framing nail", 4],
    ["Simpson", 3],
    ["joist hanger", 4],
    ["hurricane tie", 4],
    ["2x4", 4],
    ["2x6", 4],
    ["2x8", 4],
    ["2x10", 4],
    ["2x12", 4],
    ["dimensional lumber", 5],
  ],
  Roofing: [
    ["roofing", 5],
    ["roof", 4],
    ["shingle", 5],
    ["shingles", 5],
    ["underlayment", 4],
    ["ice and water", 4],
    ["ice & water", 4],
    ["drip edge", 4],
    ["flashing", 3],
    ["ridge vent", 4],
    ["soffit vent", 3],
    ["metal roof", 5],
    ["standing seam", 5],
    ["tar paper", 4],
    ["felt paper", 4],
    ["roof deck", 4],
    ["gutter", 3],
    ["gutters", 3],
    ["downspout", 3],
    ["fascia", 3],
    ["soffit", 3],
    ["skylight", 3],
  ],
  "Exterior Finishes": [
    ["siding", 5],
    ["vinyl siding", 5],
    ["hardie board", 5],
    ["fiber cement", 5],
    ["lap siding", 5],
    ["stucco", 5],
    ["exterior trim", 5],
    ["soffit", 3],
    ["fascia", 3],
    ["brick veneer", 5],
    ["stone veneer", 5],
    ["exterior paint", 4],
    ["deck", 3],
    ["decking", 4],
    ["composite deck", 5],
    ["porch", 3],
    ["railing", 3],
    ["exterior door", 4],
    ["garage door", 4],
    ["shutters", 3],
    ["house wrap", 5],
    ["tyvek", 5],
    ["weather barrier", 4],
  ],
  "Windows & Doors": [
    ["window", 5],
    ["windows", 5],
    ["door", 4],
    ["doors", 4],
    ["patio door", 5],
    ["sliding door", 5],
    ["french door", 5],
    ["entry door", 5],
    ["storm door", 4],
    ["screen door", 4],
    ["interior door", 5],
    ["door hardware", 4],
    ["door knob", 4],
    ["deadbolt", 3],
    ["lockset", 3],
    ["hinges", 2],
    ["weatherstrip", 3],
    ["glass", 2],
    ["double pane", 4],
    ["low-e", 4],
    ["window install", 5],
  ],
  Insulation: [
    ["insulation", 5],
    ["batt insulation", 5],
    ["blown insulation", 5],
    ["spray foam", 5],
    ["foam board", 4],
    ["rigid foam", 4],
    ["fiberglass", 3],
    ["cellulose", 4],
    ["r-value", 4],
    ["r-13", 5],
    ["r-19", 5],
    ["r-30", 5],
    ["r-38", 5],
    ["vapor barrier", 3],
    ["house wrap", 3],
    ["attic insulation", 5],
    ["wall insulation", 5],
  ],
  Drywall: [
    ["drywall", 5],
    ["sheetrock", 5],
    ["gypsum", 4],
    ["taping", 4],
    ["mud", 2],
    ["joint compound", 5],
    ["drywall tape", 5],
    ["texture", 3],
    ["knockdown", 4],
    ["orange peel", 4],
    ["smooth finish", 3],
    ["drywall screw", 4],
    ["corner bead", 4],
    ["skim coat", 4],
    ["plaster", 3],
    ["wall board", 4],
  ],
  "Interior Finishes": [
    ["interior finish", 5],
    ["trim", 3],
    ["baseboard", 5],
    ["crown molding", 5],
    ["crown moulding", 5],
    ["casing", 3],
    ["door casing", 5],
    ["window casing", 5],
    ["chair rail", 4],
    ["wainscoting", 4],
    ["shelving", 3],
    ["closet system", 4],
    ["stair railing", 4],
    ["stair tread", 4],
    ["newel post", 4],
    ["baluster", 4],
    ["mantle", 3],
    ["fireplace", 3],
    ["millwork", 4],
    ["finish carpentry", 5],
  ],
  Flooring: [
    ["flooring", 5],
    ["hardwood", 4],
    ["hardwood floor", 5],
    ["laminate floor", 5],
    ["vinyl plank", 5],
    ["lvp", 5],
    ["lvt", 5],
    ["tile", 3],
    ["ceramic tile", 5],
    ["porcelain tile", 5],
    ["floor tile", 5],
    ["carpet", 5],
    ["carpet pad", 4],
    ["underlayment", 3],
    ["grout", 3],
    ["thinset", 4],
    ["mortar", 3],
    ["backerboard", 4],
    ["subfloor", 3],
    ["epoxy floor", 4],
    ["concrete stain", 3],
  ],
  Plumbing: [
    ["plumbing", 5],
    ["plumber", 5],
    ["pipe", 3],
    ["pvc pipe", 4],
    ["copper pipe", 4],
    ["pex", 5],
    ["water heater", 5],
    ["tankless", 4],
    ["faucet", 4],
    ["toilet", 5],
    ["sink", 3],
    ["shower", 3],
    ["bathtub", 5],
    ["tub", 3],
    ["garbage disposal", 4],
    ["drain", 3],
    ["sewer", 4],
    ["water line", 4],
    ["shutoff valve", 4],
    ["hose bib", 4],
    ["sump pump", 4],
    ["fixture", 2],
    ["rough-in plumbing", 5],
    ["finish plumbing", 5],
  ],
  Electrical: [
    ["electrical", 5],
    ["electrician", 5],
    ["wiring", 4],
    ["wire", 3],
    ["romex", 5],
    ["outlet", 4],
    ["receptacle", 4],
    ["switch", 3],
    ["light switch", 4],
    ["breaker", 4],
    ["breaker panel", 5],
    ["panel box", 5],
    ["circuit", 3],
    ["gfci", 5],
    ["afci", 5],
    ["conduit", 4],
    ["junction box", 4],
    ["light fixture", 4],
    ["lighting", 3],
    ["ceiling fan", 4],
    ["recessed light", 5],
    ["can light", 4],
    ["smoke detector", 4],
    ["doorbell", 3],
    ["rough-in electrical", 5],
    ["finish electrical", 5],
    ["meter base", 4],
    ["service entrance", 4],
  ],
  HVAC: [
    ["hvac", 5],
    ["heating", 3],
    ["cooling", 3],
    ["air conditioning", 5],
    ["air conditioner", 5],
    ["a/c", 4],
    ["ac unit", 5],
    ["furnace", 5],
    ["heat pump", 5],
    ["ductwork", 5],
    ["duct", 4],
    ["thermostat", 4],
    ["mini split", 5],
    ["minisplit", 5],
    ["condenser", 4],
    ["air handler", 5],
    ["return air", 4],
    ["supply air", 4],
    ["register", 2],
    ["vent", 2],
    ["refrigerant", 4],
    ["blower", 3],
  ],
  Painting: [
    ["painting", 5],
    ["painter", 5],
    ["paint", 4],
    ["primer", 4],
    ["stain", 3],
    ["interior paint", 5],
    ["exterior paint", 4],
    ["latex paint", 4],
    ["oil paint", 4],
    ["brush", 2],
    ["roller", 2],
    ["caulk", 3],
    ["caulking", 3],
    ["prep work", 2],
    ["sanding", 2],
    ["wallpaper", 4],
    ["wall covering", 4],
  ],
  "Cabinets & Countertops": [
    ["cabinet", 5],
    ["cabinets", 5],
    ["countertop", 5],
    ["countertops", 5],
    ["granite", 4],
    ["quartz", 4],
    ["marble", 3],
    ["laminate counter", 5],
    ["butcher block", 4],
    ["kitchen cabinet", 5],
    ["vanity", 4],
    ["bathroom vanity", 5],
    ["cabinet hardware", 4],
    ["cabinet handle", 4],
    ["cabinet knob", 4],
    ["drawer pull", 4],
    ["soft close", 3],
    ["pantry", 3],
    ["island", 2],
    ["kitchen island", 4],
    ["backsplash", 4],
  ],
  Appliances: [
    ["appliance", 5],
    ["appliances", 5],
    ["refrigerator", 5],
    ["fridge", 5],
    ["stove", 5],
    ["oven", 4],
    ["range", 3],
    ["dishwasher", 5],
    ["microwave", 5],
    ["washer", 3],
    ["dryer", 3],
    ["washing machine", 5],
    ["range hood", 5],
    ["hood vent", 4],
    ["ice maker", 4],
    ["disposal", 3],
  ],
  "Permits & Fees": [
    ["permit", 5],
    ["permits", 5],
    ["building permit", 5],
    ["inspection", 4],
    ["inspection fee", 5],
    ["impact fee", 5],
    ["tap fee", 5],
    ["hookup fee", 5],
    ["connection fee", 5],
    ["plan review", 4],
    ["engineering", 3],
    ["architect", 3],
    ["architectural", 3],
    ["design fee", 4],
    ["survey fee", 4],
    ["utility connection", 4],
    ["building department", 5],
  ],
  Contingency: [
    ["contingency", 5],
    ["miscellaneous", 3],
    ["misc", 2],
    ["allowance", 3],
    ["change order", 4],
    ["unforeseen", 3],
    ["unexpected", 2],
    ["other", 1],
    ["adjustment", 2],
  ],
};

/**
 * Normalise text for comparison: lowercase, collapse whitespace, remove punctuation.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\/\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a single description against a single category's keyword list.
 */
function scoreCategory(
  normDescription: string,
  keywords: [string, number][]
): number {
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const [phrase, weight] of keywords) {
    totalWeight += weight;
    if (normDescription.includes(phrase.toLowerCase())) {
      matchedWeight += weight;
    }
  }

  return totalWeight > 0 ? matchedWeight / totalWeight : 0;
}

/**
 * Categorise a single line-item description.
 * Returns the best match (if any) above the minimum confidence threshold.
 */
export function categorizeLineItem(
  description: string,
  availableCategories: string[],
  minConfidence = 0.05
): CategoryMatch | null {
  const norm = normalise(description);
  if (!norm) return null;

  let best: CategoryMatch | null = null;

  for (const categoryName of availableCategories) {
    const keywords = KEYWORD_MAP[categoryName];
    if (!keywords) continue;

    const raw = scoreCategory(norm, keywords);
    if (raw < minConfidence) continue;

    // Boost if category name itself appears in description
    const nameBoost = norm.includes(categoryName.toLowerCase()) ? 0.2 : 0;
    const confidence = Math.min(1, raw + nameBoost);

    if (!best || confidence > best.confidence) {
      best = { categoryName, confidence };
    }
  }

  return best;
}

/**
 * Categorise an array of line-item descriptions in bulk.
 */
export function categorizeLineItems(
  descriptions: string[],
  availableCategories: string[],
  minConfidence = 0.05
): (CategoryMatch | null)[] {
  return descriptions.map((d) =>
    categorizeLineItem(d, availableCategories, minConfidence)
  );
}
