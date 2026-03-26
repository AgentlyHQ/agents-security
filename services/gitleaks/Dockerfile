FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod main.go ./
RUN go build -o server .

FROM zricethezav/gitleaks:latest AS gitleaks

FROM alpine:3.19
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks
COPY --from=build /app/server /usr/local/bin/server
EXPOSE 8080
CMD ["server"]
