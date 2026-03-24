FROM oven/bun:1.3.11
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
CMD ["bun", ".aixyz/output/server.js"]
