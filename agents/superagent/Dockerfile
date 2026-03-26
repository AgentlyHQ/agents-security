FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install
ARG RAILWAY_PUBLIC_DOMAIN
ENV RAILWAY_PUBLIC_DOMAIN=$RAILWAY_PUBLIC_DOMAIN
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/agents/superagent/.aixyz/output .aixyz/output
CMD ["bun", ".aixyz/output/server.js"]
