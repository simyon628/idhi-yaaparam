export type CompressOptions = {
    maxWidth: number;
    maxHeight?: number;
    quality: number;
    mimeType?: string;
};

export type ImageVariants = {
    thumbnail: Blob;   // 300px - for listing cards
    card: Blob;        // 600px - for search results
    detail: Blob;      // 1200px - for detail page
};

export async function compressImageFile(
    file: File,
    options: CompressOptions
): Promise<Blob> {
    const { maxWidth, maxHeight, quality, mimeType = 'image/jpeg' } = options;
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    return new Promise((resolve, reject) => {
        img.onload = () => {
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (targetWidth > maxWidth) {
                const scale = maxWidth / targetWidth;
                targetWidth = maxWidth;
                targetHeight = img.height * scale;
            }
            if (maxHeight && targetHeight > maxHeight) {
                const scale = maxHeight / targetHeight;
                targetHeight = maxHeight;
                targetWidth = targetWidth * scale;
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(targetWidth);
            canvas.height = Math.round(targetHeight);
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }

            // Enable high-quality downsampling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(imageUrl);
                    if (!blob) { reject(new Error('Compression failed')); return; }
                    resolve(blob);
                },
                mimeType,
                quality
            );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

/** Generate multiple sizes for a single upload — massive bandwidth savings */
export async function generateImageVariants(file: File): Promise<{
    thumbnail: Blob;  // 300px wide @ 70% quality — use for cards
    card: Blob;       // 600px wide @ 75% quality — use for search
    detail: Blob;     // 1200px wide @ 80% quality — use for detail page
}> {
    const [thumbnail, card, detail] = await Promise.all([
        compressImageFile(file, { maxWidth: 300, quality: 0.70, mimeType: 'image/jpeg' }),
        compressImageFile(file, { maxWidth: 600, quality: 0.75, mimeType: 'image/jpeg' }),
        compressImageFile(file, { maxWidth: 1200, quality: 0.80, mimeType: 'image/jpeg' }),
    ]);
    return { thumbnail, card, detail };
}

/** Convert blob to base64 data URL */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
