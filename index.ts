import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import fs from "fs";
import path from "path";

async function main() {
  const client = await CosmWasmClient.connect(
    "https://rpc-juno-ia.cosmosia.notional.ventures"
  );

  const items = fs.readdirSync(path.join(__dirname, "data"));
  const checksums = items.reduce(
    (accum, file) => ({ ...accum, [file.split(".")[0]]: 0 }),
    {}
  );

  const codes = await client.getCodes();

  for (const c of codes) {
    if (typeof checksums[c.checksum] !== "undefined") {
      console.log(c.id);
      const contracts = await client.getContracts(c.id);
      console.log(contracts);
      checksums[c.checksum]++;
    }
  }

  console.log(checksums);
}
main();
