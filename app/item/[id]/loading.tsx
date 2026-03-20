export default function Loading() {
  return (
    <div className="p-4 pb-[80px] space-y-6 max-w-2xl mx-auto">
      {/* 1. Photo placeholder: Grey rect — full width, aspect-[4/3] */}
      <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />

      {/* 2. Title + Price: Two grey lines — 60% width + 40% width */}
      <div className="space-y-3">
        <div className="w-[60%] h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-[40%] h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* 3. Badge placeholders: Three small grey pills in a row */}
      <div className="flex gap-2">
        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* 4. Seller card placeholder: Grey card — 80px tall */}
      <div className="w-full h-[80px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />

      {/* 5. Details grid placeholder: Four grey rows */}
      <div className="space-y-3">
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* 6. Description placeholder: Grey block — 60px */}
      <div className="w-full h-[60px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  );
}
