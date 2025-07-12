package config

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "test_conf.yaml")

	configContent := `PING_COUNT: 5
PING_INTERVAL: 1.0
PING_TARGETS_IPV4:
  - '8.8.8.8'
  - '1.1.1.1'
PING_TARGETS_IPV6:
  - '2001:4860:4860::8888'
TRACEROUTE_COUNT: 2
TRACEROUTE_INTERVAL: 0.5
TRACEROUTE_TARGET: '8.8.8.8'
VIA_NW_DEVICES:
  router: '192.168.1.1'
DOMAIN_A_RECORDS:
  - 'example.com'
DOMAIN_AAAA_RECORDS:
  - 'ipv6.example.com'
HTTP_IPV4_TARGET: 'https://example.com'
HTTP_IPV6_TARGET: 'https://ipv6.example.com'`

	err := os.WriteFile(configPath, []byte(configContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	cfg, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	if cfg.PingCount != 5 {
		t.Errorf("Expected PingCount=5, got %d", cfg.PingCount)
	}

	if cfg.PingInterval != 1.0 {
		t.Errorf("Expected PingInterval=1.0, got %f", cfg.PingInterval)
	}

	expectedIPv4 := []string{"8.8.8.8", "1.1.1.1"}
	if !reflect.DeepEqual(cfg.PingTargetsIPv4, expectedIPv4) {
		t.Errorf("Expected PingTargetsIPv4=%v, got %v", expectedIPv4, cfg.PingTargetsIPv4)
	}

	if cfg.ViaNetworkDevices["router"] != "192.168.1.1" {
		t.Errorf("Expected router='192.168.1.1', got %s", cfg.ViaNetworkDevices["router"])
	}
}

func TestLoadConfigFileNotFound(t *testing.T) {
	_, err := LoadConfig("/nonexistent/path/config.yaml")
	if err == nil {
		t.Error("Expected error for non-existent file, got nil")
	}
}

func TestLoadConfigInvalidYAML(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "invalid.yaml")

	invalidContent := `PING_COUNT: [this is not a number]`
	err := os.WriteFile(configPath, []byte(invalidContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	_, err = LoadConfig(configPath)
	if err == nil {
		t.Error("Expected error for invalid YAML, got nil")
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg == nil {
		t.Fatal("DefaultConfig returned nil")
	}

	if cfg.PingCount != 3 {
		t.Errorf("Expected default PingCount=3, got %d", cfg.PingCount)
	}

	if cfg.PingInterval != 0.5 {
		t.Errorf("Expected default PingInterval=0.5, got %f", cfg.PingInterval)
	}

	if len(cfg.PingTargetsIPv4) != 2 {
		t.Errorf("Expected 2 default IPv4 targets, got %d", len(cfg.PingTargetsIPv4))
	}

	if cfg.HTTPIPv4Target != "https://www.google.com" {
		t.Errorf("Expected default HTTPIPv4Target='https://www.google.com', got %s", cfg.HTTPIPv4Target)
	}
}