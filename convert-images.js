import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = "src/frontend/public/assets/images/coins";
const outputDir = "src/frontend/public/assets/images/coins/webp";

async function convertImages() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all files in the input directory
  const files = fs.readdirSync(inputDir);

  // Filter PNG files
  const pngFiles = files.filter((file) => path.extname(file).toLowerCase() === ".png");

  console.log(`Found ${pngFiles.length} PNG files to convert:`);
  pngFiles.forEach((file) => console.log(`- ${file}`));

  // Convert each PNG to WebP
  for (const file of pngFiles) {
    const inputPath = path.join(inputDir, file);
    const outputFileName = path.basename(file, ".png") + ".webp";
    const outputPath = path.join(outputDir, outputFileName);

    try {
      await sharp(inputPath).webp({ quality: 80, effort: 6 }).toFile(outputPath);

      console.log(`✓ Converted ${file} -> ${outputFileName}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error.message);
    }
  }

  console.log("\nConversion complete!");
  console.log(`Converted files are in: ${outputDir}`);
}

convertImages().catch(console.error);
