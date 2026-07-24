const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'College.csv');
const outPath = path.join(__dirname, 'lib', 'colleges.json');
const topOutPath = path.join(__dirname, 'lib', 'top_colleges.json');

console.log('Reading College.csv...');
const content = fs.readFileSync(csvPath, 'utf8');

// Robust CSV parser to handle quoted strings with commas and internal quotes
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const records = [];
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRecord.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRecord.push(currentField.trim());
            if (currentRecord.some(f => f.length > 0)) {
                records.push(currentRecord);
            }
            currentRecord = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        if (currentRecord.some(f => f.length > 0)) {
            records.push(currentRecord);
        }
    }
    return records;
}

// Generate intelligent acronyms from college names
function generateAcronym(name) {
    if (!name) return '';
    // Clean name: remove parentheses content for acronym calculation unless necessary
    const cleaned = name.replace(/\([^)]*\)/g, '').trim();
    // Words to skip in acronym generation unless it's a 2-word name
    const stopWords = new Set(['of', 'and', 'the', 'for', '&', 'in', 'on', 'at', 'to']);
    const words = cleaned.split(/[\s\-_,.]+/).filter(Boolean);
    
    let acronymChars = [];
    for (const word of words) {
        const lower = word.toLowerCase();
        if (!stopWords.has(lower) || words.length <= 2) {
            // Take first letter/digit
            const match = word.match(/[a-zA-Z0-9]/);
            if (match) {
                acronymChars.push(match[0].toUpperCase());
            }
        }
    }
    return acronymChars.join('');
}

// Famous top colleges popularity scoring booster
function getPopularityScore(name, city, state) {
    let score = 0;
    const lowerName = name.toLowerCase();

    // Priority Tier 1: Top Tier Institutions
    if (/\b(iit|indian institute of technology)\b/.test(lowerName)) score += 1000;
    else if (/\b(nit|national institute of technology)\b/.test(lowerName)) score += 900;
    else if (/\b(iiit|indian institute of information technology)\b/.test(lowerName)) score += 850;
    else if (/\b(bits|birla institute of technology)\b/.test(lowerName)) score += 800;
    else if (/\bsrm\b/.test(lowerName)) score += 750;
    else if (/\bsrkr\b|sagi rama krishnam raju/.test(lowerName)) score += 740;
    else if (/\bvit\b|vellore institute/.test(lowerName)) score += 730;
    else if (/\bmanipal\b/.test(lowerName)) score += 700;
    else if (/\bamrita\b/.test(lowerName)) score += 680;
    else if (/\bthapar\b/.test(lowerName)) score += 670;
    else if (/\bpsg\b/.test(lowerName)) score += 660;

    // College type boost
    if (lowerName.includes('university')) score += 50;
    if (lowerName.includes('engineering') || lowerName.includes('technology')) score += 30;

    return score;
}

const records = parseCSV(content);
console.log(`Parsed ${records.length} CSV rows total.`);

if (records.length === 0) {
    console.error("CSV empty or parsing failed!");
    process.exit(1);
}

const headers = records[0];
console.log("Headers:", headers);

// Expected column indexes:
// State: 0, District: 1, University Name: 3, College Name: 4, College Type: 5, Address: 6, Website: 7
const stateIdx = 0;
const districtIdx = 1;
const collegeNameIdx = 4;
const addressIdx = 6;
const websiteIdx = 7;

const colleges = [];
const seenKeys = new Set();
let idCounter = 1;

for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length <= collegeNameIdx) continue;

    const rawName = row[collegeNameIdx];
    if (!rawName || rawName.length < 3) continue;

    // Clean up name (remove excess spaces, trailing Id if any)
    let name = rawName.replace(/\s+/g, ' ').trim();
    // E.g. "Jawaharlal Nehru Rajkeeya Mahavidyalaya (Id: C-6498)" -> keep clean name or strip Id tag
    const cleanName = name.replace(/\s*\(Id:\s*[A-Z0-9-]+\)\s*/gi, '').trim();

    const state = (row[stateIdx] || '').trim();
    const city = (row[districtIdx] || '').trim();
    const address = (row[addressIdx] || '').trim();
    const website = (row[websiteIdx] || '').trim();

    const dedupeKey = `${cleanName.toLowerCase()}_${city.toLowerCase()}_${state.toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    const acronym = generateAcronym(cleanName);
    const score = getPopularityScore(cleanName, city, state);

    // Aliases to boost searchability
    const aliases = [acronym];
    if (acronym === 'SRKR') aliases.push('SRKR', 'SRKR Engineering', 'Sagi Rama');
    if (acronym === 'SRM') aliases.push('SRM', 'SRMIST', 'SRM University');
    if (cleanName.toLowerCase().includes('sagi rama')) aliases.push('SRKR');

    colleges.push({
        id: `col-${idCounter++}`,
        name: cleanName,
        acronym: acronym,
        state: state,
        city: city,
        address: address,
        website: website,
        popularityScore: score,
        aliases: Array.from(new Set(aliases.filter(Boolean)))
    });
}

// Sort colleges by popularityScore descending, then by name ascending
colleges.sort((a, b) => {
    if (b.popularityScore !== a.popularityScore) {
        return b.popularityScore - a.popularityScore;
    }
    return a.name.localeCompare(b.name);
});

console.log(`Extracted and deduplicated ${colleges.length} colleges.`);

// Write full list
fs.writeFileSync(outPath, JSON.stringify(colleges, null, 2));
console.log(`Saved full dataset to ${outPath}`);

// Write top 500 list for instant zero-latency client pre-cache
const topColleges = colleges.slice(0, 500);
fs.writeFileSync(topOutPath, JSON.stringify(topColleges, null, 2));
console.log(`Saved top 500 dataset to ${topOutPath}`);
