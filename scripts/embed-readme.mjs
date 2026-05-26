/**
 * Windows 下 npm publish 会因路径末尾反斜杠导致 README 解析到父目录。
 * 发布前将 README.md 写入 package.json 的 readme 字段以绕过该问题。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.readme = readFileSync(join(root, "README.md"), "utf8");
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("embed-readme: wrote README into package.json");
