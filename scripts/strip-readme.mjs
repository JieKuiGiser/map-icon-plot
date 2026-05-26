import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
delete pkg.readme;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("strip-readme: removed readme field from package.json");
