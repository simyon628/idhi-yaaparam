import Tesseract from 'tesseract.js';

/**
 * Verifies a student ID by matching the extracted roll number from an image against the provided roll number.
 * Pattern: [A-Z]{3}\d{4}-\d{3} (e.g., ECE2024-001)
 */
export async function verifyID(rollNumber: string, imageFile: File) {
    try {
        const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');

        // Regex for ECE2024-001 style roll numbers
        const rollPattern = /([A-Z]{3}\d{4}-\d{3})/;
        const match = text.match(rollPattern);
        const extractedRoll = match ? match[0] : null;

        if (!extractedRoll) {
            throw new Error('NO_ROLL_NUMBER_DETECTED');
        }

        if (extractedRoll.toUpperCase() !== rollNumber.toUpperCase()) {
            throw new Error('ROLL_NUMBER_MISMATCH');
        }

        return {
            success: true,
            extractedRoll
        };
    } catch (error) {
        console.error('OCR Verification Error:', error);
        throw error;
    }
}
