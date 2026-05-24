import { NextRequest, NextResponse } from "next/server";

// ── Mock Product Database ─────────────────────────────────────────────────────
// Replace this with a real Firestore query once tested

export const MOCK_PRODUCTS = [
  { id: "p_001", name: "Calculator", category: "Calculators" },
  { id: "p_002", name: "Casio fx-991EX", category: "Calculators" },
  { id: "p_003", name: "Casio fx-991MS", category: "Calculators" },
  { id: "p_004", name: "Casio fx-82MS", category: "Calculators" },
  { id: "p_005", name: "Lab Coat", category: "Lab Essentials" },
  { id: "p_006", name: "Lab Gloves", category: "Lab Essentials" },
  { id: "p_007", name: "Lab Goggles", category: "Lab Essentials" },
  { id: "p_008", name: "Drafter", category: "Drawing Tools" },
  { id: "p_009", name: "Drawing Board", category: "Drawing Tools" },
  { id: "p_010", name: "Set Square", category: "Drawing Tools" },
  { id: "p_011", name: "Compass Box", category: "Drawing Tools" },
  { id: "p_012", name: "Protractor", category: "Drawing Tools" },
  { id: "p_013", name: "Arduino Uno", category: "Electronics" },
  { id: "p_014", name: "Arduino Nano", category: "Electronics" },
  { id: "p_015", name: "Breadboard", category: "Electronics" },
  { id: "p_016", name: "Multimeter", category: "Electronics" },
  { id: "p_017", name: "Soldering Iron", category: "Electronics" },
  { id: "p_018", name: "Resistor Kit", category: "Electronics" },
  { id: "p_019", name: "Stethoscope", category: "Medical" },
  { id: "p_020", name: "Survey Instruments", category: "Civil Engineering" },
];

// ── API Handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8", 10), 20);

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const lower = q.toLowerCase().trim();

  // Split into prefix matches and substring matches
  const prefixMatches = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().startsWith(lower)
  );
  const substrMatches = MOCK_PRODUCTS.filter(
    (p) =>
      !p.name.toLowerCase().startsWith(lower) &&
      p.name.toLowerCase().includes(lower)
  );

  const results = [...prefixMatches, ...substrMatches].slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
  }));

  return NextResponse.json(
    { suggestions: results },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "same-origin",
      },
    }
  );
}
