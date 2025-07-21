package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ConfigEntry represents a configuration entry for a host
type ConfigEntry struct {
	HostPattern string
	Username    string
	Password    string
	EnablePass  string
	Method      string
	Port        int
}

// loadConfigFile loads configuration from a file
func loadConfigFile(filename string, config *Config) error {
	// If filename doesn't start with /, prepend home directory
	if !strings.HasPrefix(filename, "/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return err
		}
		filename = filepath.Join(home, filename)
	}

	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	// Check file permissions
	fileInfo, err := os.Stat(filename)
	if err != nil {
		return err
	}
	if fileInfo.Mode().Perm()&0077 != 0 {
		return fmt.Errorf("config file %s must not be world readable/writable", filename)
	}

	entries := []ConfigEntry{}
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse line
		entry, err := parseConfigLine(line)
		if err != nil {
			return fmt.Errorf("error parsing line %d: %v", lineNum, err)
		}
		if entry != nil {
			entries = append(entries, *entry)
		}
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	// Apply matching configuration
	applyConfigEntries(entries, config)

	return nil
}

// parseConfigLine parses a single configuration line
func parseConfigLine(line string) (*ConfigEntry, error) {
	// Format: add <type> <pattern> <value>
	// Example: add user router* admin
	// Example: add password router* secret123
	// Example: add method router* ssh

	parts := strings.Fields(line)
	if len(parts) < 4 || parts[0] != "add" {
		return nil, nil // Skip non-add lines
	}

	configType := parts[1]
	pattern := parts[2]
	value := strings.Join(parts[3:], " ")

	entry := &ConfigEntry{HostPattern: pattern}

	switch configType {
	case "user", "username":
		entry.Username = value
	case "password", "pass":
		entry.Password = value
	case "enablepass", "enable":
		entry.EnablePass = value
	case "method":
		entry.Method = value
	case "port":
		fmt.Sscanf(value, "%d", &entry.Port)
	default:
		return nil, fmt.Errorf("unknown config type: %s", configType)
	}

	return entry, nil
}

// applyConfigEntries applies matching configuration entries to the config
func applyConfigEntries(entries []ConfigEntry, config *Config) {
	// Apply configuration for each host
	for _, host := range config.Hosts {
		for _, entry := range entries {
			if matchPattern(entry.HostPattern, host) {
				if entry.Username != "" && config.Username == "" {
					config.Username = entry.Username
				}
				if entry.Password != "" && config.Password == "" {
					config.Password = entry.Password
				}
				if entry.EnablePass != "" && config.EnablePass == "" {
					config.EnablePass = entry.EnablePass
				}
				if entry.Method != "" && config.Method == "ssh" { // Don't override if explicitly set
					config.Method = entry.Method
				}
				if entry.Port != 0 && config.Port == 22 { // Don't override if explicitly set
					config.Port = entry.Port
				}
			}
		}
	}
}

// matchPattern matches a pattern against a hostname
func matchPattern(pattern, hostname string) bool {
	// Convert shell-style pattern to regex
	regexPattern := "^" + strings.ReplaceAll(
		strings.ReplaceAll(pattern, ".", "\\."),
		"*", ".*",
	) + "$"
	
	matched, err := regexp.MatchString(regexPattern, hostname)
	if err != nil {
		return false
	}
	return matched
}

// getDefaultConfigFile returns the default config file path
func getDefaultConfigFile() string {
	// Check environment variable first
	if envFile := os.Getenv("CRUNRC"); envFile != "" {
		return envFile
	}
	
	// Default to ~/.crunrc
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return filepath.Join(home, ".crunrc")
}