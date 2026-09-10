import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { experienceKeys, projects, translations } from "../data/portfolio-content.js";

const readText = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const hash = (path) =>
  createHash("sha256").update(readFileSync(new URL(path, import.meta.url))).digest("hex");

const page = readText("../app/_components/portfolio.js");
const layout = readText("../app/layout.js");
const styles = readText("../app/globals.css");
const robots = readText("../app/robots.js");
const sitemap = readText("../app/sitemap.js");
const logo = readText("../public/assets/images/logo.svg");
const gitignore = readText("../.gitignore");
const packageJson = JSON.parse(readText("../package.json"));

assert.ok(translations.en && translations.id, "English and Indonesian translations must exist");

const expectedExperience = [
  ["exp7", "PT. Sayap Mas Utama (WINGS GROUP)", 3],
  ["exp1", "PT. Folka Indonesia Teknologi (FOLKATECH)", 5],
  ["exp2", "PT. Jagad Aman Prima", 6],
  ["exp3", "PT. Aimedika Futura Indonesia", 6],
  ["exp4", "CV. Adaptive Kreasi Teknologi", 3],
  ["exp5", "PT. Telkom Indonesia", 5],
  ["exp6", "PT. Majapahit Teknologi Nusantara", 5],
];

for (const [key, company, dutyCount] of expectedExperience) {
  for (const language of ["en", "id"]) {
    assert.equal(translations[language][`${key}Company`], company);
    assert.equal(translations[language][`${key}Duties`].length, dutyCount);
  }
}

assert.match(translations.en.exp7Duties.join(" "), /SAP.*Apache Kafka.*SOAP.*RESTful/s);
assert.deepEqual(experienceKeys, expectedExperience.map(([key]) => key));
assert.equal(projects.length, 5);

for (const id of ["home", "about", "experience", "projects", "contact"]) {
  assert.match(page, new RegExp(`id="${id}"`), `#${id} target is missing`);
}

assert.match(page, /useState\("en"\)/);
assert.match(page, /IntersectionObserver/);
assert.match(page, /prefers-reduced-motion: reduce/);
assert.match(page, /onSubmit=\{submitContact\}/);
assert.match(page, /Satrio-Nugroho-CV\.pdf/);
assert.match(layout, /title: "Satrio Nugroho"/);
assert.match(layout, /alternates: \{ canonical: "\/" \}/);
assert.match(layout, /"@type": "Person"/);
assert.match(layout, /application\/ld\+json/);
assert.match(layout, /from "next\/font\/google"/);
assert.match(page, /from "next\/image"/);
assert.match(robots, /sitemap: "https:\/\/satrionugroho\.com\/sitemap\.xml"/);
assert.match(sitemap, /url: "https:\/\/satrionugroho\.com\/"/);

assert.equal(packageJson.dependencies.next, "16.3.4");
assert.equal(packageJson.dependencies.react, "19.3.0");
assert.match(styles, /--bg:\s*#f4f7fa/);
assert.match(styles, /--bg-deep:\s*#081522/);
assert.match(styles, /--accent:\s*#3f739f/);
assert.match(styles, /--contact:\s*#e6edf4/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(logo, /^<svg[\s\S]*<title[^>]*>Satrio Nugroho monogram<\/title>/);
assert.doesNotMatch(`${styles}\n${logo}`, /#a8eb68|#b9f783|168,\s*235,\s*104/i);
assert.doesNotMatch(`${styles}\n${logo}`, /#4da3ff|77,\s*163,\s*255/i);
assert.match(gitignore, /^\/\.next\/$/m);
assert.match(gitignore, /^\.env\*$/m);
assert.match(gitignore, /^!\.env\.example$/m);
assert.match(gitignore, /^\.forgeguard\/$/m);
assert.doesNotMatch(gitignore, /package-lock\.json|public\/assets/);

const expectedResumeHash = "5724363ae0dd28d48dc12b43e04fcc0a6d3905fd262dbedf22a36466d469c06d";
assert.equal(hash("../public/assets/documents/Satrio-Nugroho-CV.pdf"), expectedResumeHash);
assert.equal(hash("../public/assets/documents/Satrio-Nugroho-CV.pdf"), hash("../assets/documents/Satrio-Nugroho-CV.pdf"));
assert.equal(hash("../public/assets/images/logo.svg"), hash("../assets/images/logo.svg"));

console.log("Next.js portfolio smoke checks passed");
