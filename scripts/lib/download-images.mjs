import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Source files remain local and stable across catalog rebuilds. */
export async function downloadImages(root, assets) {
  const unique = [
    ...new Map(assets.map((asset) => [asset.file, asset])).values(),
  ];
  for (let offset = 0; offset < unique.length; offset += 4) {
    await Promise.all(
      unique.slice(offset, offset + 4).map(async (asset) => {
        if (
          !asset.file.startsWith("/images/panjabishop/") ||
          asset.file.includes("..")
        )
          throw new Error(`Invalid asset path: ${asset.file}`);
        const destination = path.join(root, "public", asset.file);
        try {
          await fs.access(destination);
          return;
        } catch {
          /* Download missing files. */
        }
        const response = await fetch(asset.url, {
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok)
          throw new Error(
            `Image download failed: ${response.status} ${asset.url}`,
          );
        const image = await sharp(Buffer.from(await response.arrayBuffer()))
          .rotate()
          .resize({ width: asset.width ?? 1200, withoutEnlargement: true })
          .webp({ quality: 86 })
          .toBuffer();
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(`${destination}.tmp`, image);
        await fs.rename(`${destination}.tmp`, destination);
      }),
    );
  }
}
