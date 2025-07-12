package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	PingCount          int               `yaml:"PING_COUNT"`
	PingInterval       float64           `yaml:"PING_INTERVAL"`
	PingTargetsIPv4    []string          `yaml:"PING_TARGETS_IPV4"`
	PingTargetsIPv6    []string          `yaml:"PING_TARGETS_IPV6"`
	TracerouteCount    int               `yaml:"TRACEROUTE_COUNT"`
	TracerouteInterval float64           `yaml:"TRACEROUTE_INTERVAL"`
	TracerouteTarget   string            `yaml:"TRACEROUTE_TARGET"`
	ViaNetworkDevices  map[string]string `yaml:"VIA_NW_DEVICES"`
	DomainARecords     []string          `yaml:"DOMAIN_A_RECORDS"`
	DomainAAAARecords  []string          `yaml:"DOMAIN_AAAA_RECORDS"`
	HTTPIPv4Target     string            `yaml:"HTTP_IPV4_TARGET"`
	HTTPIPv6Target     string            `yaml:"HTTP_IPV6_TARGET"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	return &config, nil
}

func DefaultConfig() *Config {
	return &Config{
		PingCount:    3,
		PingInterval: 0.5,
		PingTargetsIPv4: []string{
			"8.8.8.8",
			"1.1.1.1",
		},
		PingTargetsIPv6: []string{
			"2001:4860:4860::8888",
			"2606:4700:4700::1111",
		},
		TracerouteCount:    3,
		TracerouteInterval: 1.0,
		TracerouteTarget:   "8.8.8.8",
		ViaNetworkDevices: map[string]string{
			"router":  "192.168.1.1",
			"gateway": "10.0.0.1",
		},
		DomainARecords: []string{
			"google.com",
			"github.com",
		},
		DomainAAAARecords: []string{
			"google.com",
			"ipv6.google.com",
		},
		HTTPIPv4Target: "https://www.google.com",
		HTTPIPv6Target: "https://ipv6.google.com",
	}
}