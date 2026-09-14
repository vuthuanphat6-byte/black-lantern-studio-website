import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/art", { recursive: true });
for (const name of ["hero-vietnam", "lotus-river"]) {
  await sharp("src/assets/" + name + ".png")
    .resize({ width: 1680, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile("public/art/" + name + ".webp");
}
await sharp("src/assets/hero-vietnam.png")
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 82 })
  .toFile("public/social.jpg");
await sharp("src/assets/logo-original.jpg")
  .resize(64, 64)
  .png()
  .toFile("public/favicon.png");
await sharp("src/assets/logo-original.jpg")
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");
console.log("Responsive gallery, social image and favicon assets ready.");
