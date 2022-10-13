import decompress from "decompress";
import decompressTargz from "decompress-targz";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import fetch from "node-fetch";

const writeFilePromise = promisify(fs.writeFile);

async function main() {
  const response = await fetch(
    "https://api.github.com/repos/cosmwasm/cw-plus/releases",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `0xArbi:${process.env.GITHUB_TOKEN}`,
      },
    }
  );

  if (response.status !== 200) {
    console.log("invalid status", response.status);
    return;
  }

  const releases = await response.json();

  for (const { name, assets } of releases) {
    console.log(name);

    console.log(assets.length, "assets");

    const checksums = assets.find((x) => x.name === "checksums.txt");
    if (!checksums) {
      continue;
    }

    const jsons = assets.filter((x) => x.name.endsWith(".json"));
    console.log(jsons.length, "JSON files");

    const tars = assets.filter((x) => x.name.endsWith("_schema.tar.gz"));
    console.log(tars.length, "tar files");

    const [c, jsonFiles, tarFiles] = await Promise.all([
      fetch(checksums.browser_download_url).then((x) => x.text()),
      await Promise.all(
        jsons.map((x) => fetch(x.browser_download_url).then((x) => x.json()))
      ),
      await Promise.all(
        tars.map(async (x) => {
          const [name] = x.name.split("_schema.tar.gz");
          return {
            name,
            file: await fetch(x.browser_download_url),
          };
        })
      ),
    ]);

    // contract name to checkum
    const mapping = c
      .split("\n")
      .map((x) => x.split("  "))
      .filter((x) => x.length === 2)
      .reduce(
        (accum, [checksum, filename]) => ({
          ...accum,
          [filename.split(".")[0]]: checksum,
        }),
        {}
      );

    for (const { name, file } of tarFiles) {
      const formattedName = name.replace("-", "_");
      const checksum = mapping[formattedName];
      if (!checksum) {
        console.log("Missing checksum for tar file", formattedName);
        continue;
      }

      const source = `/tmp/${formattedName}.tar.gz`;
      const dest = `/tmp/${formattedName}`;
      await Promise.resolve(file)
        .then((x) => x.arrayBuffer())
        .then((x) => writeFilePromise(source, Buffer.from(x)));
      await decompress(source, dest, {
        plugins: [decompressTargz()],
      });

      const output = {
        execute: {},
        query: {},
        responses: {},
      };

      const schemaFiles = fs.readdirSync(`${dest}/schema`);
      for (const file of schemaFiles) {
        const data = JSON.parse(
          fs.readFileSync(`${dest}/schema/${file}`).toString()
        );

        if (file.endsWith("_execute_msg.json")) {
          output.execute = data;
        }

        if (file.endsWith("_query_msg.json")) {
          output.query = data;
        }

        if (file.endsWith("_response.json")) {
          output.responses = {
            ...output.responses,
            [data.title]: {
              data,
            },
          };
        }
      }

      fs.writeFileSync(
        path.join(__dirname, "..", "data", `${checksum}.json`),
        JSON.stringify(output)
      );
    }

    jsonFiles.forEach((file) => {
      const { contract_name } = file;
      const formattedName = contract_name.replace("-", "_");
      const checksum = mapping[formattedName];

      if (!checksum) {
        console.log("Missing checksum for JSON file", contract_name);
        return;
      }

      fs.writeFileSync(
        path.join(__dirname, "..", "data", `${checksum}.json`),
        JSON.stringify(file)
      );
    });
  }
}

main();
