package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"
)

type Config struct {
	Hosts        []string // Changed from Host to Hosts for multiple hosts
	Port         int
	Username     string
	Password     string
	EnablePass   string
	Commands     []string
	Method       string // ssh or telnet
	Timeout      int
	ConfigFile   string
	Silent       bool   // suppress all non-essential output
	Debug        bool
	JSONOutput   bool   // output in JSON format
	Parallel     bool   // execute on hosts in parallel
	KeyFile      string // SSH private key file path
	KeyPassphrase string // SSH key passphrase
}

// CommandResult represents the result of a single command
type CommandResult struct {
	Command   string `json:"command"`
	Output    string `json:"output"`
	Error     string `json:"error,omitempty"`
	Timestamp string `json:"timestamp"`
}

// HostResult represents the execution result for a single host
type HostResult struct {
	Host     string          `json:"host"`
	Results  []CommandResult `json:"results"`
	Success  bool            `json:"success"`
	Duration string          `json:"duration"`
	Error    string          `json:"error,omitempty"`
}

// ExecutionResult represents the complete execution result for all hosts
type ExecutionResult struct {
	Hosts       []HostResult `json:"hosts"`
	TotalHosts  int          `json:"total_hosts"`
	Successful  int          `json:"successful"`
	Failed      int          `json:"failed"`
	Duration    string       `json:"duration"`
	Parallel    bool         `json:"parallel"`
}

func main() {
	config := parseFlags()
	
	if len(config.Hosts) == 0 {
		fmt.Fprintf(os.Stderr, "Error: at least one host is required\n")
		os.Exit(1)
	}

	if len(config.Commands) == 0 {
		fmt.Fprintf(os.Stderr, "Error: at least one command is required\n")
		os.Exit(1)
	}

	// Load config from file
	configFile := config.ConfigFile
	if configFile == "" {
		configFile = getDefaultConfigFile()
	}
	if configFile != "" {
		if _, err := os.Stat(configFile); err == nil {
			if err := loadConfigFile(configFile, &config); err != nil {
				fmt.Fprintf(os.Stderr, "Error loading config file: %v\n", err)
				os.Exit(1)
			}
		}
	}

	// Debug output
	if config.Debug {
		fmt.Fprintf(os.Stderr, "Debug: Hosts=%v, Port=%d, User=%s, Method=%s, Parallel=%v\n", 
			config.Hosts, config.Port, config.Username, config.Method, config.Parallel)
	}

	// Execute on all hosts
	if config.JSONOutput {
		executeOnHostsJSON(&config)
	} else {
		executeOnHostsText(&config)
	}
}

func parseFlags() Config {
	var config Config
	var commandStr string
	var hostStr string

	flag.StringVar(&hostStr, "host", "", "Target host(s) - comma separated for multiple")
	flag.StringVar(&hostStr, "h", "", "Target host(s) (shorthand)")
	flag.IntVar(&config.Port, "port", 22, "Port number")
	flag.IntVar(&config.Port, "p", 22, "Port number (shorthand)")
	flag.StringVar(&config.Username, "user", "", "Username")
	flag.StringVar(&config.Username, "u", "", "Username (shorthand)")
	flag.StringVar(&config.Password, "pass", "", "Password")
	flag.StringVar(&config.EnablePass, "enable", "", "Enable password")
	flag.StringVar(&config.EnablePass, "e", "", "Enable password (shorthand)")
	flag.StringVar(&commandStr, "command", "", "Commands to execute (semicolon separated)")
	flag.StringVar(&commandStr, "c", "", "Commands to execute (shorthand)")
	flag.StringVar(&config.Method, "method", "ssh", "Connection method (ssh or telnet)")
	flag.StringVar(&config.Method, "m", "ssh", "Connection method (shorthand)")
	flag.IntVar(&config.Timeout, "timeout", 30, "Connection timeout in seconds")
	flag.IntVar(&config.Timeout, "t", 30, "Connection timeout (shorthand)")
	flag.StringVar(&config.ConfigFile, "config", "", "Config file path")
	flag.StringVar(&config.ConfigFile, "f", "", "Config file path (shorthand)")
	flag.BoolVar(&config.Silent, "silent", true, "Suppress non-essential output")
	flag.BoolVar(&config.Silent, "s", true, "Suppress non-essential output (shorthand)")
	flag.BoolVar(&config.Debug, "debug", false, "Enable debug output")
	flag.BoolVar(&config.Debug, "d", false, "Enable debug output (shorthand)")
	flag.BoolVar(&config.JSONOutput, "json", false, "Output in JSON format")
	flag.BoolVar(&config.JSONOutput, "j", false, "Output in JSON format (shorthand)")
	flag.BoolVar(&config.Parallel, "parallel", true, "Execute on hosts in parallel")
	flag.BoolVar(&config.Parallel, "P", true, "Execute on hosts in parallel (shorthand)")
	flag.StringVar(&config.KeyFile, "key", "", "SSH private key file path")
	flag.StringVar(&config.KeyFile, "i", "", "SSH private key file path (shorthand)")
	flag.StringVar(&config.KeyPassphrase, "passphrase", "", "SSH key passphrase")

	flag.Parse()

	// Parse commands
	if commandStr != "" {
		config.Commands = strings.Split(commandStr, ";")
		// Trim spaces from each command
		for i := range config.Commands {
			config.Commands[i] = strings.TrimSpace(config.Commands[i])
		}
	}

	// Parse hosts
	if hostStr != "" {
		config.Hosts = strings.Split(hostStr, ",")
		// Trim spaces from each host
		for i := range config.Hosts {
			config.Hosts[i] = strings.TrimSpace(config.Hosts[i])
		}
	}

	// If username not specified, try environment variables
	if config.Username == "" {
		if u := os.Getenv("CRUN_USER"); u != "" {
			config.Username = u
		} else if u := os.Getenv("USER"); u != "" {
			config.Username = u
		}
	}

	return config
}

func executeOnHostsText(config *Config) {
	for _, host := range config.Hosts {
		if len(config.Hosts) > 1 {
			fmt.Printf("=== %s ===\n", host)
		}
		
		hostConfig := *config
		err := executeOnSingleHostText(&hostConfig, host)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error on host %s: %v\n", host, err)
			continue
		}
		
		if len(config.Hosts) > 1 {
			fmt.Println()
		}
	}
}

func executeOnSingleHostText(config *Config, host string) error {
	// Load host-specific config
	if config.ConfigFile != "" || getDefaultConfigFile() != "" {
		configFile := config.ConfigFile
		if configFile == "" {
			configFile = getDefaultConfigFile()
		}
		if _, err := os.Stat(configFile); err == nil {
			if err := loadConfigFile(configFile, config); err != nil {
				return fmt.Errorf("error loading config file: %v", err)
			}
		}
	}

	// Create connection
	conn, err := createConnection(config)
	if err != nil {
		return fmt.Errorf("error creating connection: %v", err)
	}
	defer conn.Close()

	// Override host in SSH config
	if sshConn, ok := conn.(*SSHConnection); ok {
		sshConn.host = host
	}

	// Connect to the device
	if err := conn.Connect(); err != nil {
		return fmt.Errorf("error connecting: %v", err)
	}

	// Execute commands
	for _, cmd := range config.Commands {
		output, err := conn.Execute(cmd)
		if err != nil {
			return fmt.Errorf("error executing command '%s': %v", cmd, err)
		}
		fmt.Print(output)
	}
	
	return nil
}

func executeOnHostsJSON(config *Config) {
	startTime := time.Now()
	result := ExecutionResult{
		Hosts:      []HostResult{},
		TotalHosts: len(config.Hosts),
		Parallel:   config.Parallel,
	}

	if config.Parallel {
		executeHostsParallel(config, &result)
	} else {
		executeHostsSequential(config, &result)
	}

	result.Duration = time.Since(startTime).String()
	
	// Count successful/failed
	for _, hostResult := range result.Hosts {
		if hostResult.Success {
			result.Successful++
		} else {
			result.Failed++
		}
	}

	// Output JSON
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(result); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

func executeHostsParallel(config *Config, result *ExecutionResult) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	
	for _, host := range config.Hosts {
		wg.Add(1)
		go func(h string) {
			defer wg.Done()
			hostResult := executeOnSingleHostJSON(config, h)
			
			mu.Lock()
			result.Hosts = append(result.Hosts, hostResult)
			mu.Unlock()
		}(host)
	}
	
	wg.Wait()
}

func executeHostsSequential(config *Config, result *ExecutionResult) {
	for _, host := range config.Hosts {
		hostResult := executeOnSingleHostJSON(config, host)
		result.Hosts = append(result.Hosts, hostResult)
	}
}

func executeOnSingleHostJSON(config *Config, host string) HostResult {
	startTime := time.Now()
	hostResult := HostResult{
		Host:    host,
		Results: []CommandResult{},
		Success: true,
	}

	// Create a copy of config for this host
	hostConfig := *config
	
	// Load host-specific config
	if config.ConfigFile != "" || getDefaultConfigFile() != "" {
		configFile := config.ConfigFile
		if configFile == "" {
			configFile = getDefaultConfigFile()
		}
		if _, err := os.Stat(configFile); err == nil {
			if err := loadConfigFile(configFile, &hostConfig); err != nil {
				hostResult.Error = fmt.Sprintf("error loading config file: %v", err)
				hostResult.Success = false
				hostResult.Duration = time.Since(startTime).String()
				return hostResult
			}
		}
	}

	// Create connection
	conn, err := createConnection(&hostConfig)
	if err != nil {
		hostResult.Error = fmt.Sprintf("error creating connection: %v", err)
		hostResult.Success = false
		hostResult.Duration = time.Since(startTime).String()
		return hostResult
	}
	defer conn.Close()

	// Override host in SSH config
	if sshConn, ok := conn.(*SSHConnection); ok {
		sshConn.host = host
	}

	// Connect to the device
	if err := conn.Connect(); err != nil {
		hostResult.Error = fmt.Sprintf("error connecting: %v", err)
		hostResult.Success = false
		hostResult.Duration = time.Since(startTime).String()
		return hostResult
	}

	// Execute commands
	for _, cmd := range config.Commands {
		cmdResult := CommandResult{
			Command:   cmd,
			Timestamp: time.Now().Format(time.RFC3339),
		}

		output, err := conn.Execute(cmd)
		if err != nil {
			cmdResult.Error = err.Error()
			hostResult.Success = false
		} else {
			cmdResult.Output = strings.TrimSpace(output)
		}

		hostResult.Results = append(hostResult.Results, cmdResult)
	}

	hostResult.Duration = time.Since(startTime).String()
	return hostResult
}