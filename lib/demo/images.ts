const INPUT_LIMIT = 5 * 1024 * 1024;
const OUTPUT_LIMIT = 300 * 1024;
const MAX_DIMENSION = 1200;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("This image could not be read."));
    reader.onerror = () =>
      reject(new Error("This image could not be read. Try another file."));
    reader.onabort = () => reject(new Error("Image reading was cancelled."));
    reader.readAsDataURL(file);
  });
}

function decodeImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "This file is not a readable image. Choose a JPG, PNG, or WebP image.",
        ),
      );
    image.src = source;
  });
}

function imageBytes(dataUrl: string): number {
  const content = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return (
    Math.floor((content.length * 3) / 4) -
    (content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0)
  );
}

/** Decode and resize photos locally; the returned image travels with demo backups. */
export async function readDemoImage(file: File): Promise<string> {
  if (!MIME_TYPES.has(file.type))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > INPUT_LIMIT)
    throw new Error("Choose an image smaller than 5 MB.");
  if (file.size === 0)
    throw new Error("This image is empty. Choose another file.");
  const image = await decodeImage(await fileDataUrl(file));
  if (!image.naturalWidth || !image.naturalHeight)
    throw new Error("This image has invalid dimensions.");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error(
      "Your browser could not prepare this image. Try another browser.",
    );
  let scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  try {
    // Quality falls first; unusually detailed images then get a smaller canvas.
    for (let sizeAttempt = 0; sizeAttempt < 7; sizeAttempt += 1) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58, 0.44]) {
        const result = canvas.toDataURL("image/webp", quality);
        if (!result.startsWith("data:image/"))
          throw new Error("Your browser could not save this image.");
        if (imageBytes(result) <= OUTPUT_LIMIT) return result;
        // Browsers that cannot encode WebP fall back to PNG; changing quality will not help.
        if (!result.startsWith("data:image/webp;")) break;
      }
      scale *= 0.75;
    }
    throw new Error(
      "This image is too detailed for browser storage. Try a smaller image.",
    );
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    image.src = "";
  }
}
