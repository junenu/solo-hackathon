package main

import (
	"fmt"
	"strings"
)

// Connection interface for different connection types
type Connection interface {
	Connect() error
	Execute(command string) (string, error)
	Close() error
}

// createConnection creates a connection based on the method specified
func createConnection(config *Config) (Connection, error) {
	switch strings.ToLower(config.Method) {
	case "ssh":
		return NewSSHConnection(config), nil
	case "telnet":
		// TODO: Implement telnet connection
		return nil, fmt.Errorf("telnet not yet implemented")
	default:
		return nil, fmt.Errorf("unknown connection method: %s", config.Method)
	}
}