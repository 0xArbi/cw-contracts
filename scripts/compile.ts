import fs from "fs";
import path from "path";

async function main() {
  const dataPath = path.join(__dirname, "..", "data");
  const checksums = fs.readdirSync(dataPath);
  for (const checksum of checksums) {
    const output = {
      execute: {},
      query: {},
      responses: {},
    };

    const schemaPath = path.join(dataPath, checksum, "schema");
    if (!fs.existsSync(schemaPath)) {
      continue;
    }

    const files = fs.readdirSync(schemaPath);
    for (const file of files) {
      const data = JSON.parse(
        fs.readFileSync(path.join(schemaPath, file)).toString()
      );

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

    fs.writeFileSync(
      path.join(dataPath, checksum, "compiled.json"),
      JSON.stringify(output)
    );
  }
}
main();
