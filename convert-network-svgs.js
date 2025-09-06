import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const networksDir = path.join(__dirname, "src/frontend/public/assets/images/networks");

// Fungsi untuk convert SVG ke WebP
async function convertSvgToWebp(svgPath, webpPath) {
  try {
    // Baca file SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert SVG to WebP dengan ukuran 64x64 dan kualitas 90
    await sharp(svgBuffer)
      .resize(64, 64, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background
      })
      .webp({
        quality: 90,
        effort: 6,
      })
      .toFile(webpPath);

    console.log(`✅ Converted: ${path.basename(svgPath)} → ${path.basename(webpPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(svgPath)}:`, error.message);
  }
}

// Fungsi utama
async function convertAllSvgs() {
  // Baca semua file di direktori
  const files = fs.readdirSync(networksDir);

  // Filter hanya file SVG
  const svgFiles = files.filter((file) => file.endsWith(".svg"));

  if (svgFiles.length === 0) {
    console.log("❌ No SVG files found in networks directory");
    return;
  }

  console.log(`🔄 Converting ${svgFiles.length} SVG files to WebP...`);

  // Convert setiap file SVG
  for (const svgFile of svgFiles) {
    const svgPath = path.join(networksDir, svgFile);
    const webpFile = svgFile.replace(".svg", ".webp");
    const webpPath = path.join(networksDir, webpFile);

    await convertSvgToWebp(svgPath, webpPath);
  }

  console.log("✅ All conversions completed!");
}

// Jalankan konversi
convertAllSvgs().catch(console.error);
