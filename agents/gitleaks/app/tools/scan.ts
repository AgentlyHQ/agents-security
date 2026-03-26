import { tool } from "ai";
import type { Accepts } from "aixyz/accepts";
import { z } from "zod";

const GITLEAKS_BASE_URL = process.env.GITLEAKS_BASE_URL ?? "http://gitleaks.railway.internal:8080";

interface GitleaksFinding {
  Description: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Match: string;
  Secret: string;
  File: string;
  SymlinkFile: string;
  Commit: string;
  Entropy: number;
  Author: string;
  Email: string;
  Date: string;
  Message: string;
  Tags: string[];
  RuleID: string;
  Fingerprint: string;
}

function redact(value: string): string {
  if (value.length <= 8) {
    return value.slice(0, 2) + "*".repeat(value.length - 2);
  }
  const visibleStart = Math.min(4, Math.floor(value.length * 0.15));
  const visibleEnd = Math.min(4, Math.floor(value.length * 0.15));
  return value.slice(0, visibleStart) + "*".repeat(value.length - visibleStart - visibleEnd) + value.slice(-visibleEnd);
}

export const accepts: Accepts = {
  scheme: "exact",
  price: "$0.01",
};

export default tool({
  description:
    "Scan text or code for exposed credentials, API keys, tokens, private keys, and other secrets. Returns findings with rule ID, description, redacted secret, line number, and tags.",
  inputSchema: z.object({
    text: z.string().describe("The code or text content to scan for exposed secrets."),
  }),
  execute: async ({ text }) => {
    const response = await fetch(`${GITLEAKS_BASE_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scan service error (${response.status}): ${errorText}`);
    }

    const raw: GitleaksFinding[] = await response.json();

    const findings = raw.map((f) => ({
      ruleId: f.RuleID,
      description: f.Description,
      match: redact(f.Secret || f.Match),
      startLine: f.StartLine,
      endLine: f.EndLine,
      tags: f.Tags ?? [],
    }));

    return {
      totalFindings: findings.length,
      findings,
    };
  },
});
