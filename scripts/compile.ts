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

      // fully compiled schema. Let's just munge it to fit our format
      if (data.instantiate && data.execute && data.query) {
        output.definitions = {
          ...output.definitions,
          ...data.execute.definitions,
          ...data.query.definitions,
        };
        for (const response in data.responses) {
          if (data.responses[response].definitions) {
            output.definitions = {
              ...output.definitions,
              ...data.responses[response].definitions,
            };
          }
        }
        output.execute = {
          ...data.execute,
          definitions: undefined,
        };
        output.query = {
          ...data.query,
          definitions: undefined,
        };
      }

      if (file.includes("execute_msg")) {
        output.execute = { ...data, definitions: undefined };
      }

      if (file.includes("query_msg.json")) {
        output.query = { ...data, definitions: undefined };
      }

      if (file.includes("response.json")) {
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
