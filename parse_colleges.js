const fs = require('fs');

const csvPath = 'C:\\Users\\SIMYON\\Downloads\\Indian_Engineering_Colleges_Dataset.csv';
const outPath = 'd:\\idhi yaaparam\\lib\\colleges.json';

const content = fs.readFileSync(csvPath, 'utf8');

// The format is: ,College_Name,State,,
// Values might be quoted if they contain commas.

const lines = content.split('\n').filter(l => l.trim().length > 0);

// We'll use a simple regex to parse the CSV line
function parseCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let currentVal = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(currentVal);
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    result.push(currentVal);
    return result;
}

const colleges = [];
let idCounter = 1;

for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 3) {
        let name = cols[1].trim();
        let state = cols[2].trim();

        if (name) {
            colleges.push({
                id: idCounter.toString(),
                name: name,
                district: "India", // Default or extract if needed
                state: state
            });
            idCounter++;
        }
    }
}

// Write to colleges.json
fs.writeFileSync(outPath, JSON.stringify(colleges, null, 2));
console.log(`Successfully extracted ${colleges.length} colleges.`);
