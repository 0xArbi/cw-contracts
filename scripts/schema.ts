import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const [, , folder] = process.argv;

async function main() {
  if (!folder) {
    console.log("Missing args");
    return;
  }

  const contracts = fs.readdirSync(path.join(folder, "contracts"));

  for (const contract of contracts) {
    execSync("cargo schema", {
      cwd: path.join(folder, "contracts", contract),
      stdio: "inherit",
    });
  }
}
main();
