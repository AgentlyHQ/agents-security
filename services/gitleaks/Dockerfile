FROM golang:1.22-alpine AS build
RUN apk add --no-cache git
RUN go install github.com/zricethezav/gitleaks/v8@latest
WORKDIR /app
COPY go.mod main.go ./
RUN go build -o server .

FROM alpine:3.19
RUN apk add --no-cache git
COPY --from=build /go/bin/gitleaks /usr/local/bin/gitleaks
COPY --from=build /app/server /usr/local/bin/server
EXPOSE 8080
CMD ["server"]
