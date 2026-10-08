// Validate painted SVG wrappers before the Husky build ships.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] || "public/assets";
const errors = [];
let checked = 0;
let embedded = 0;

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!entry.name.endsWith(".svg")) continue;
    checked++;
    const svg = readFileSync(file, "utf8");
    if (!svg.includes("<svg") || !svg.includes("</svg>")) {
      errors.push(file + ": invalid SVG wrapper");
      continue;
    }
    const matches = [...svg.matchAll(/data:image\/(png|webp);base64,([^"']+)/g)];
    if (matches.length !== svg.split("data:image/").length - 1) {
      errors.push(file + ": invalid embedded image declaration");
    }
    for (const match of matches) {
      embedded++;
      const payload = match[2];
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
        errors.push(file + ": invalid base64");
        continue;
      }
      const bytes = Buffer.from(payload, "base64");
      const png = match[1] === "png";
      const valid = png
        ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" &&
          bytes.subarray(-12).toString("hex") === "0000000049454e44ae426082"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP" &&
          bytes.length >= 12 && bytes.readUInt32LE(4) === bytes.length - 8;
      if (!valid) errors.push(file + ": incomplete embedded image");
    }
  }
}

scan(root);
if (!checked) errors.push("No SVG assets found");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated " + checked + " SVGs and " + embedded + " embedded images.");
}
