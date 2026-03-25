FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/agents/superagent/.aixyz/output .aixyz/output
CMD ["bun", ".aixyz/output/server.js"]
