import type { AixyzConfig } from "aixyz/config";

const config: AixyzConfig = {
  name: "Gitleaks",
  description:
    "Scan code and text for exposed credentials, API keys, tokens, and other secrets. Get detailed findings with rule ID, redacted match, file location, and tags.",
  version: "1.1.0",
  url: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined,
  x402: {
    payTo: "0x0799872E07EA7a63c79357694504FE66EDfE4a0A",
    network: process.env.NODE_ENV === "production" ? "eip155:8453" : "eip155:84532",
  },
  skills: [
    {
      id: "scan",
      name: "Secret Scanner",
      description:
        "Scan code, configuration files, or text for exposed credentials such as API keys, tokens, private keys, and database connection strings.",
      tags: ["security", "secrets", "credentials", "scanning"],
      examples: [
        "Scan this code for leaked secrets: const apiKey = 'AKIAIOSFODNN7EXAMPLE'",
        "Check this config file for exposed credentials",
        "Analyze my .env file for any hardcoded secrets that should be rotated",
      ],
    },
  ],
};

export default config;
