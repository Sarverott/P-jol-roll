# lawchaind: the chain of the law (phase 39) - a Cosmos SDK chain on which the mirrors agree on
# the law, each a validator recording the roots of the years it sealed. Built from stacks/go/lawchain.
FROM golang:1.26-bookworm AS build
WORKDIR /src
COPY stacks/go/lawchain/go.mod stacks/go/lawchain/go.sum ./
RUN go mod download
COPY stacks/go/lawchain/ ./
RUN CGO_ENABLED=0 go build -trimpath -o /lawchaind ./cmd/lawchaind

FROM debian:bookworm-slim
COPY --from=build /lawchaind /usr/local/bin/lawchaind
RUN useradd --create-home --uid 1000 mirror && mkdir /data && chown mirror /data
USER mirror
ENTRYPOINT ["lawchaind", "--home", "/data"]
CMD ["start"]
