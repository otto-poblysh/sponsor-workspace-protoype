const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { buildVideoLocale } = require("../tools/build-video-i18n.js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "association", "video-en");
const I18N = path.join(ROOT, "association", "i18n");

function buildTo(locale) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "assoc-vid-" + locale + "-"));
  const catalogMap = {
    "beat-00-intro.html": null,
    "beat-01-dashboard.html": "index",
    "beat-02-members.html": "entities",
    "beat-03-skill-gap.html": "skill-gap",
    "beat-04-reports.html": "general-report",
    "beat-05-audit.html": "activity-logs",
    "beat-06-outro.html": null
  };
  buildVideoLocale({ srcDir: SRC, outDir, i18nDir: I18N, locale, catalogMap });
  return outDir;
}

test("association English intro renders correct signature and titles", () => {
  const intro = fs.readFileSync(path.join(SRC, "compositions/beat-00-intro.html"), "utf8");
  assert.ok(intro.includes("Association"), "signature must be Association");
  assert.ok(intro.includes("Community Employment Portal"), "title line 1 must be Community Employment Portal");
  assert.ok(intro.includes("Demo for Job Creation"), "title line 2 must be Demo for Job Creation");
});

for (const locale of ["fr", "es"]) {
  test("[" + locale + "] association generated files open with the doctype", () => {
    const out = buildTo(locale);
    for (const f of ["index.html", ...fs.readdirSync(path.join(out, "compositions")).map((c) => "compositions/" + c)]) {
      const head = fs.readFileSync(path.join(out, f), "utf8").slice(0, 200);
      assert.ok(/^<!DOCTYPE html>/i.test(head),
        locale + "/" + f + " must open with the doctype or accents will corrupt");
    }
  });

  test("[" + locale + "] association intro has localized signature and titles", () => {
    const out = buildTo(locale);
    const intro = fs.readFileSync(path.join(out, "compositions/beat-00-intro.html"), "utf8");
    const expectedSig = locale === "fr" ? "Association" : "Asociación";
    const expectedLine1 = locale === "fr" ? "Portail Communautaire de l'Emploi" : "Portal Comunitario de Empleo";
    const expectedLine2 = locale === "fr" ? "Démonstration pour la Création d'Emplois" : "Demostración para la Creación de Empleo";

    assert.ok(intro.includes(expectedSig), "missing " + expectedSig + " in " + locale + " intro");
    assert.ok(intro.includes(expectedLine1), "missing " + expectedLine1 + " in " + locale + " intro");
    assert.ok(intro.includes(expectedLine2), "missing " + expectedLine2 + " in " + locale + " intro");
  });

  test("[" + locale + "] association has no mojibake and no English subtitle survives", () => {
    const out = buildTo(locale);
    const video = JSON.parse(fs.readFileSync(path.join(I18N, "video." + locale + ".json"), "utf8"));
    for (const f of fs.readdirSync(path.join(out, "compositions"))) {
      const html = fs.readFileSync(path.join(out, "compositions", f), "utf8");
      assert.ok(!/Ã[©¨«¢]/.test(html), "mojibake in " + locale + "/" + f);
      for (const en of Object.keys(video)) {
        assert.ok(!html.includes("textContent: \"" + en + "\"") && !html.includes("textContent: '" + en + "'"),
          locale + "/" + f + " still carries the English subtitle \"" + en + "\"");
      }
    }
  });

  test("[" + locale + "] association timing is preserved byte-for-byte", () => {
    const out = buildTo(locale);
    const timing = (s) => (s.match(/data-(start|duration|track-index|width|height)="[^"]*"/g) || []).join("|");
    assert.strictEqual(
      timing(fs.readFileSync(path.join(out, "index.html"), "utf8")),
      timing(fs.readFileSync(path.join(SRC, "index.html"), "utf8"))
    );
  });
}
