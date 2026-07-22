import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const root = process.cwd();
const port = 4175;
const url = `http://127.0.0.1:${port}/`;
const outputDirectory = path.join(root, "test-results");
const outputPath = path.join(outputDirectory, "lighthouse.json");
const budget = JSON.parse(
  await readFile(path.join(root, "lighthouse-budget.json"), "utf8")
);

const serverEntry = path.join(root, "node_modules", "http-server", "bin", "http-server");
const server = spawn(
  process.execPath,
  [serverEntry, ".", "-a", "127.0.0.1", "-p", String(port), "-c-1"],
  { cwd: root, stdio: "ignore", windowsHide: true }
);

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Local Lighthouse server did not start in time.");
};

let chrome;

try {
  await waitForServer();
  chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"]
  });

  const result = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"]
  });

  if (!result?.lhr || !result.report) {
    throw new Error("Lighthouse returned no report.");
  }

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, result.report, "utf8");

  const scores = Object.fromEntries(
    Object.keys(budget.scores).map((category) => [
      category,
      result.lhr.categories[category].score
    ])
  );
  const metrics = Object.fromEntries(
    Object.keys(budget.metrics).map((audit) => [
      audit,
      result.lhr.audits[audit].numericValue
    ])
  );

  console.log(
    JSON.stringify(
      {
        scores: Object.fromEntries(
          Object.entries(scores).map(([name, score]) => [name, Math.round(score * 100)])
        ),
        metrics: {
          lcp: `${Math.round(metrics["largest-contentful-paint"])} ms`,
          cls: Number(metrics["cumulative-layout-shift"].toFixed(4))
        }
      },
      null,
      2
    )
  );

  const failures = [
    ...Object.entries(budget.scores)
      .filter(([category, minimum]) => scores[category] < minimum)
      .map(([category, minimum]) => `${category}: ${scores[category]} < ${minimum}`),
    ...Object.entries(budget.metrics)
      .filter(([audit, maximum]) => metrics[audit] > maximum)
      .map(([audit, maximum]) => `${audit}: ${metrics[audit]} > ${maximum}`)
  ];

  if (failures.length) {
    throw new Error(`Lighthouse budget failed:\n${failures.join("\n")}`);
  }
} finally {
  if (chrome) {
    try {
      await chrome.kill();
    } catch (error) {
      if (error?.code !== "EPERM") throw error;
    }
  }
  server.kill();
}
