import Tesseract from 'tesseract.js';

export type IdVerificationParams = {
    imageFile: File;
    rollNumber: string;
    collegeName: string;
    collegeAliases: string[];
};

export type IdVerificationResult =
    | { status: 'success'; rawText: string }
    | {
        status: 'fail';
        reason: 'ROLL_NOT_FOUND' | 'COLLEGE_NOT_FOUND' | 'OCR_ERROR';
        rawText?: string;
        errorMessage?: string
    };

export async function verifyIdCardWithOcr(params: IdVerificationParams): Promise<IdVerificationResult> {
    const { imageFile, rollNumber, collegeName, collegeAliases } = params;

    try {
        // 1. Run local OCR using eng language profile
        const result = await Tesseract.recognize(imageFile, 'eng', {
            logger: m => console.log(m) // helpful for debugging
        });

        // Extract raw text
        const rawText = result.data.text;
        if (!rawText) throw new Error("No text found in image.");

        // 2. Normalize text: Lowercase and strip excessive whitespace
        const normalizedText = rawText.toLowerCase().replace(/\s+/g, ' ');

        // 3. Match Roll Number
        const normalizedRollNumber = rollNumber.trim().toLowerCase();
        if (!normalizedText.includes(normalizedRollNumber)) {
            return { status: 'fail', reason: 'ROLL_NOT_FOUND', rawText };
        }

        // 4. Match College Name Or ANY Alias
        const searchTerms = [collegeName, ...collegeAliases].map(t => t.trim().toLowerCase());

        // If the card contains any of the known names/acronyms for the campus
        const collegeFound = searchTerms.some(term => normalizedText.includes(term));

        if (!collegeFound) {
            return { status: 'fail', reason: 'COLLEGE_NOT_FOUND', rawText };
        }

        // 5. Success Check
        return { status: 'success', rawText };

    } catch (error: any) {
        console.error("Tesseract Engine Error:", error);
        return {
            status: 'fail',
            reason: 'OCR_ERROR',
            errorMessage: error?.message ?? 'Tesseract failed to parse image.'
        };
    }
}
