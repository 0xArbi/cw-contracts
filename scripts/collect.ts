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
    fs.mkdirSync(outDir);
  } catch {}
  fs.cpSync(folder, outDir);
  fs.writeFileSync(path.join(outDir, "schema.json"), JSON.stringify(output));
}
main();
