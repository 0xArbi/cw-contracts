import fs from "fs";
import path from "path";

const [, , folder, checksum] = process.argv;

async function main() {
  if (!folder || !checksum) {
    console.log("Missing args");
    return;
  }

  const files = fs.readdirSync(folder);

  const output = {
    execute: {},
    query: {},
    responses: {},
  };

  for (const file of files) {
    console.log(file);
    const data = JSON.parse(fs.readFileSync(`${folder}/${file}`).toString());

    if (file.endsWith("execute_msg.json")) {
      output.execute = data;
    }

    if (file.endsWith("query_msg.json")) {
      output.query = data;
    }

    if (file.endsWith("response.json")) {
      output.responses = {
        ...output.responses,
        [data.title]: {
          data,
        },
      };
    }
  }

  const outDir = path.join(__dirname, "..", "data", checksum.toLowerCase());
  try {
    console.log("mkdir", outDir);
    fs.mkdirSync(outDir, { recursive: true });
  } catch {}
  console.log("cp", folder, outDir);
  fs.cpSync(folder, path.join(outDir, "schema"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "compiled.json"), JSON.stringify(output));
}
main();
