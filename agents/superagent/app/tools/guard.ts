import { tool } from "ai";
import { buildGuardSystemPrompt, buildGuardUserMessage, getProvider, parseModel, processInput } from "safety-agent";
import { z } from "zod";

const MODEL = "superagent/guard-0.6b";

export const accepts = {
  scheme: "free",
};

export default tool({
  description:
    "Analyze user input for security threats such as prompt injection, system prompt extraction, or data exfiltration attempts. Classifies content as pass or block.",
  inputSchema: z.object({
    text: z
      .string()
      .optional()
      .describe("The user input text to analyze for security threats. Provide either text or url."),
    url: z
      .url()
      .optional()
      .describe("URL to content (text or PDF) to analyze for security threats. Provide either text or url."),
  }),
  execute: async ({ text, url }) => {
    if (!text && !url) {
      throw new Error("At least one of text or url must be provided.");
    }

    const processed = await processInput(text ?? url!);
    const content = processed.text ?? text ?? url!;

    const { provider: providerName, model } = parseModel(MODEL);
    const provider = getProvider(providerName);

    const messages = [
      { role: "system" as const, content: buildGuardSystemPrompt() },
      { role: "user" as const, content: buildGuardUserMessage(content) },
    ];

    const requestBody = provider.transformRequest(model, messages, undefined);
    const headers = provider.authHeader("");
    const endpoint = provider.buildUrl!(provider.baseUrl, model);

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Guard API error (${response.status}): ${errorText}`);
    }

    const responseData = await response.json();
    const result = provider.transformResponse(responseData);
    const parsed = JSON.parse(result.choices[0].message.content);

    return {
      classification: parsed.classification,
      reasoning: parsed.reasoning,
      violation_types: parsed.violation_types ?? [],
      cwe_codes: parsed.cwe_codes ?? [],
      usage: result.usage,
    };
  },
});
