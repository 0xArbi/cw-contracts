import fs from "fs";
import path from "path";

const [, , folder, checksum] = process.argv;

async function main() {
  if (!folder || !checksum) {
    console.log("Missing args");
    return;
  }

  const outDir = path.join(__dirname, "..", "data", checksum.toLowerCase());
  try {
    console.log("mkdir", outDir);
    fs.mkdirSync(outDir, { recursive: true });
  } catch {}
  console.log("cp", folder, outDir);
  fs.cpSync(path.join(folder, "schema"), path.join(outDir, "schema"), {
    recursive: true,
  });
}
main();
