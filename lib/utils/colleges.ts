import { College } from "@/lib/types";

let cachedColleges: College[] = [];

export async function getLocalColleges(): Promise<College[]> {
    if (cachedColleges.length > 0) return cachedColleges;

    try {
        const response = await fetch('/colleges.csv');
        if (!response.ok) throw new Error("Could not find colleges.csv");

        const csvText = await response.text();
        const lines = csvText.split('\n');
        const colleges: College[] = [];

        let isFirst = true;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            if (isFirst) {
                isFirst = false;
                continue; // Skip header
            }

            const parts = line.split(',');
            let name = "";
            let stateField = "";

            if (line.includes('"')) {
                const firstQuote = line.indexOf('"');
                const lastQuote = line.lastIndexOf('"');
                name = line.substring(firstQuote + 1, lastQuote).trim();

                const remaining = line.substring(lastQuote + 1).split(',');
                stateField = remaining[1] || remaining[0];
            } else {
                name = parts[1]?.trim();
                stateField = parts[2]?.trim();
            }

            if (name) {
                colleges.push({
                    id: `csv-${i}`,
                    name,
                    state: stateField || "",
                    city: "",
                    lat: 0,
                    lng: 0
                } as College);
            }
        }

        colleges.sort((a, b) => a.name.localeCompare(b.name));
        cachedColleges = colleges;
        return colleges;

    } catch (error) {
        console.error("Failed to parse local CSV:", error);
        return [];
    }
}
