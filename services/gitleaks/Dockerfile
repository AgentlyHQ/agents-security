FROM golang:1.22-alpine AS build
WORKDIR /app
COPY services/gitleaks/go.mod services/gitleaks/main.go ./
RUN go build -o server .

FROM zricethezav/gitleaks:latest
COPY --from=build /app/server /usr/local/bin/server
EXPOSE 8080
ENTRYPOINT []
CMD ["server"]
