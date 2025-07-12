.PHONY: build test clean install deps run

BINARY_NAME=pingood
BINARY_PATH=./bin/$(BINARY_NAME)
CMD_PATH=./cmd/pingood
VERSION?=dev
BUILD_TIME=$(shell date +%Y%m%d-%H%M%S)
LDFLAGS=-ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME)"

# Default target
all: deps test build

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run tests
test:
	go test -v ./...

# Build for current platform
build: deps
	mkdir -p ./bin
	go build $(LDFLAGS) -o $(BINARY_PATH) $(CMD_PATH)

# Build for multiple platforms
build-all: deps
	mkdir -p ./bin
	# Linux amd64
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o ./bin/$(BINARY_NAME)-linux-amd64 $(CMD_PATH)
	# macOS amd64
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o ./bin/$(BINARY_NAME)-darwin-amd64 $(CMD_PATH)
	# macOS arm64 (Apple Silicon)
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o ./bin/$(BINARY_NAME)-darwin-arm64 $(CMD_PATH)
	# Windows amd64
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o ./bin/$(BINARY_NAME)-windows-amd64.exe $(CMD_PATH)

# Run the application
run: build
	$(BINARY_PATH) -i $(shell ip route | grep default | head -1 | sed 's/.*dev \([^ ]*\).*/\1/' 2>/dev/null || echo "eth0")

# Run with custom interface
run-interface: build
	@read -p "Enter network interface: " iface; \
	$(BINARY_PATH) -i $$iface

# Clean build artifacts
clean:
	rm -rf ./bin

# Install to system
install: build
	sudo cp $(BINARY_PATH) /usr/local/bin/

# Uninstall from system
uninstall:
	sudo rm -f /usr/local/bin/$(BINARY_NAME)

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Run with race detection
test-race:
	go test -race -v ./...

# Generate coverage report
coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Show help
help:
	@echo "Available targets:"
	@echo "  deps         - Download and tidy Go modules"
	@echo "  test         - Run tests"
	@echo "  build        - Build binary for current platform"
	@echo "  build-all    - Build binaries for all supported platforms"
	@echo "  run          - Build and run with auto-detected interface"
	@echo "  run-interface- Build and run with user-specified interface"
	@echo "  clean        - Remove build artifacts"
	@echo "  install      - Install binary to /usr/local/bin"
	@echo "  uninstall    - Remove binary from /usr/local/bin"
	@echo "  fmt          - Format Go code"
	@echo "  lint         - Run linter (requires golangci-lint)"
	@echo "  test-race    - Run tests with race detection"
	@echo "  coverage     - Generate test coverage report"
	@echo "  help         - Show this help message"