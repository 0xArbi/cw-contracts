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
      definitions: {},
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

      output.definitions = {
        ...output.definitions,
        ...(data.definitions ?? {}),
      };

      if (file.endsWith("execute_msg.json")) {
        output.execute = { ...data, definitions: undefined };
      }

      if (file.endsWith("query_msg.json")) {
        output.query = { ...data, definitions: undefined };
      }

      if (file.endsWith("response.json")) {
        for (const response in data) {
          if (data[response].definitions) {
            output.definitions = {
              ...output.definitions,
              ...data[response].definitions,
            };
          }
        }
        output.responses = {
          ...output.responses,
          [data.title]: { ...data, definitions: undefined },
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
