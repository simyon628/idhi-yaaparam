export type CompressOptions = {
    maxWidth: number;        // e.g. 1280
    maxHeight?: number;      // optional, can maintain aspect ratio by width only
    quality: number;         // 0–1, e.g. 0.7
    mimeType?: string;       // default "image/jpeg"
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
            const originalWidth = img.width;
            const originalHeight = img.height;

            // Calculate target size (keep aspect ratio)
            let targetWidth = originalWidth;
            let targetHeight = originalHeight;

            if (originalWidth > maxWidth) {
                const scale = maxWidth / originalWidth;
                targetWidth = maxWidth;
                targetHeight = originalHeight * scale;
            }

            if (maxHeight && targetHeight > maxHeight) {
                const scale = maxHeight / targetHeight;
                targetHeight = maxHeight;
                targetWidth = targetWidth * scale;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context not available'));
                return;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Image compression failed'));
                        return;
                    }
                    resolve(blob);
                    URL.revokeObjectURL(imageUrl);
                },
                mimeType,
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image for compression'));
        };
        img.src = imageUrl;
    });
}
