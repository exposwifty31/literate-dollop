#!/usr/bin/env tsx
/**
 * contracts-review-agent
 *
 * Usage:
 *   CURSOR_API_KEY=cursor_... pnpm contracts:review
 *   CURSOR_API_KEY=cursor_... pnpm contracts:review --base main
 *
 * What it does:
 *   1. Diffs packages/contracts/src against the base branch (default: main)
 *   2. Runs pnpm contracts:gate to confirm the gate is green
 *   3. Launches a local Cursor agent that reads the diff and produces:
 *      - Impact assessment (safe / minor / breaking)
 *      - Ready-to-paste vettrack companion PR body
 *      - Updated contracts-bump-runbook checklist items
 *
 * Exit codes:
 *   0 — gate green, agent completed
 *   1 — startup failure (auth, config, network)
 *   2 — gate failed or agent run failed
 */

import { execFileSync, execSync } from "child_process";
import { writeFileSync } from "fs";
import { Agent, CursorAgentError } from "@cursor/sdk";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "main";

const OUT_FILE = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : undefined;

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), encoding: "utf8" });
}

function gateGreen(): boolean {
  try {
    execSync("pnpm contracts:gate", {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    return true;
  } catch {
    return false;
  }
}

function getContractsDiff(): string {
  try {
    return execFileSync(
      "git",
      ["diff", `${BASE}...HEAD`, "--", "packages/contracts/src/", "packages/contracts/package.json"],
      { cwd: process.cwd(), encoding: "utf8" }
    ).trim();
  } catch {
    // If the base branch doesn't exist locally, diff against HEAD
    return execFileSync(
      "git",
      ["diff", "HEAD~1...HEAD", "--", "packages/contracts/src/", "packages/contracts/package.json"],
      { cwd: process.cwd(), encoding: "utf8" }
    ).trim();
  }
}

async function main() {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    console.error("Error: CURSOR_API_KEY is not set.");
    console.error("  Get your key at https://cursor.com/dashboard/cloud-agents");
    process.exit(1);
  }

  // --- Step 1: diff ---
  console.log(`\n[contracts-review] Diffing packages/contracts against '${BASE}'…`);
  const diff = getContractsDiff();

  if (!diff) {
    console.log("[contracts-review] No changes to packages/contracts. Nothing to review.");
    process.exit(0);
  }

  const lineCount = diff.split("\n").length;
  console.log(`[contracts-review] ${lineCount} lines changed in contracts.`);

  // --- Step 2: gate ---
  console.log("\n[contracts-review] Running pnpm contracts:gate…");
  if (!gateGreen()) {
    console.error("\n[contracts-review] contracts:gate FAILED — fix gate errors before reviewing.");
    process.exit(2);
  }
  console.log("[contracts-review] Gate green ✓");

  // --- Step 3: agent ---
  console.log("\n[contracts-review] Launching Cursor agent for impact analysis…\n");

  const prompt = `
You are reviewing a change to the @vettrack/contracts package in the literate-dollop monorepo.
The contracts package is installed in a separate monolith (exposwifty31/vettrack) via a github: path dep.

CONTRACTS DIFF (against ${BASE}):
\`\`\`diff
${diff}
\`\`\`

The three surfaces that carry safety risk (from docs/contracts-bump-runbook.md):
- emergency.ts — EMERGENCY_OFFLINE_BLOCK_MUTATIONS (Code Blue offline-block constant)
- emergency.ts — classifyEmergencyEndpoint (emergency classifier function)
- pending-sync.ts — PendingSyncType (mutation type enum used in vettrack replay)

Produce EXACTLY this output (no other prose):

## Impact: <SAFE | MINOR | BREAKING>

One-sentence justification.

## vettrack companion PR body

\`\`\`markdown
## Summary
<2–4 bullet points describing what changed in @vettrack/contracts and why vettrack needs this bump>

## Checklist
- [ ] \`pnpm contracts:gate\` green in literate-dollop (CI confirms)
- [ ] \`packages/contracts\` version bumped to <new version from diff or "TBD">
- [ ] Updated \`github:\` dep in vettrack package.json
- [ ] \`pnpm install && bash scripts/ci/contracts-gate.sh && npx tsc --noEmit\` green in vettrack
- [ ] Parity spot-check: diff of emergency.ts and pending-sync.ts both empty
<add any surface-specific items if safety surfaces changed>
\`\`\`

## Parity diff commands (run after vettrack installs new version)

\`\`\`bash
diff -u ~/literate-dollop/packages/contracts/src/emergency.ts \\
        ~/vettrack/node_modules/@vettrack/contracts/src/emergency.ts

diff -u ~/literate-dollop/packages/contracts/src/pending-sync.ts \\
        ~/vettrack/node_modules/@vettrack/contracts/src/pending-sync.ts
\`\`\`
`.trim();

  const agent = await Agent.create({
    apiKey,
    model: { id: "composer-2" },
    local: { cwd: process.cwd() },
  });

  let runId: string | undefined;

  try {
    const agentRun = await agent.send(prompt);
    runId = agentRun.id;
    console.log(`[contracts-review] Run ID: ${runId}`);
    console.log("[contracts-review] Streaming agent output…\n");
    console.log("─".repeat(72));

    const outputChunks: string[] = [];

    for await (const event of agentRun.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
            outputChunks.push(block.text);
          }
        }
      }
    }

    const result = await agentRun.wait();
    console.log("\n" + "─".repeat(72));

    if (result.status === "error") {
      console.error(`\n[contracts-review] Agent run failed (run ${runId}).`);
      throw Object.assign(new Error("agent-run-failed"), { exitCode: 2 });
    }

    if (OUT_FILE) {
      const content = outputChunks.join("") + `\n\n---\n_Run ID: ${runId} · ${new Date().toISOString()}_\n`;
      writeFileSync(OUT_FILE, content, "utf8");
      console.log(`\n[contracts-review] Output written to ${OUT_FILE}`);
    }

    console.log("\n[contracts-review] Done. Paste the PR body above into the vettrack companion PR.");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`\n[contracts-review] Startup failed: ${err.message}`);
      console.error(`  Retryable: ${err.isRetryable}`);
      throw Object.assign(err, { exitCode: 1 });
    }
    throw err;
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

main().catch((err: unknown) => {
  const code = (err as { exitCode?: number }).exitCode ?? 2;
  process.exit(code);
});
