const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dpknqzt5z',
  api_key: '851527243191262',
  api_secret: 'ODeITb7B0geQu0KK9qz3UA_p1Rs',
  secure: true
});

(async function run() {
  try {
    // 2. Upload an image
    console.log("Uploading sample image...");
    const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
      public_id: "onboarding_sample"
    });
    console.log("Upload successful!");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    console.log("\nImage Details:");
    console.log("Width:", uploadResult.width);
    console.log("Height:", uploadResult.height);
    console.log("Format:", uploadResult.format);
    console.log("File size (bytes):", uploadResult.bytes);

    // 4. Transform the image
    // f_auto: Automatically converts the image to the most efficient format based on the browser (e.g., WebP, AVIF)
    // q_auto: Automatically compresses the image to minimize file size without noticeable loss of visual quality
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);
  } catch (error) {
    console.error("Error during execution:", error);
  }
})();
