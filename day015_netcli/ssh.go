package main

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

type SSHConnection struct {
	config    *Config
	host      string
	client    *ssh.Client
	session   *ssh.Session
	stdin     io.WriteCloser
	stdout    io.Reader
	connected bool
}

func NewSSHConnection(config *Config) *SSHConnection {
	host := ""
	if len(config.Hosts) > 0 {
		host = config.Hosts[0]
	}
	return &SSHConnection{
		config: config,
		host:   host,
	}
}

func (s *SSHConnection) Connect() error {
	// Prepare authentication methods
	authMethods := []ssh.AuthMethod{}
	
	// Add key authentication if key file is specified
	if s.config.KeyFile != "" {
		keyAuth, err := s.createKeyAuth()
		if err != nil {
			return fmt.Errorf("failed to setup key authentication: %v", err)
		}
		authMethods = append(authMethods, keyAuth)
	}
	
	// Add password authentication if password is provided
	if s.config.Password != "" {
		authMethods = append(authMethods, ssh.Password(s.config.Password))
	}
	
	// If no authentication method is provided, try default key locations
	if len(authMethods) == 0 {
		defaultKeyAuth, err := s.tryDefaultKeys()
		if err == nil {
			authMethods = append(authMethods, defaultKeyAuth)
		}
		if len(authMethods) == 0 {
			return fmt.Errorf("no authentication method provided (password or key)")
		}
	}

	sshConfig := &ssh.ClientConfig{
		User:            s.config.Username,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         time.Duration(s.config.Timeout) * time.Second,
	}

	// Connect to SSH server
	addr := fmt.Sprintf("%s:%d", s.host, s.config.Port)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}
	s.client = client

	// Create session
	session, err := client.NewSession()
	if err != nil {
		client.Close()
		return fmt.Errorf("failed to create session: %v", err)
	}
	s.session = session

	// Set up pipes
	stdin, err := session.StdinPipe()
	if err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to create stdin pipe: %v", err)
	}
	s.stdin = stdin

	stdout, err := session.StdoutPipe()
	if err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to create stdout pipe: %v", err)
	}
	s.stdout = stdout

	// Start shell
	if err := session.Shell(); err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to start shell: %v", err)
	}

	s.connected = true

	// Wait for prompt and handle initial banner
	if err := s.waitForPrompt(); err != nil {
		return fmt.Errorf("failed to get initial prompt: %v", err)
	}

	// Set terminal length to 0 to avoid pagination
	if _, err := s.executeInternal("terminal length 0"); err != nil {
		// Try Cisco command
		if _, err := s.executeInternal("terminal pager 0"); err != nil {
			// Ignore error, not all devices support this
		}
	}

	// Enable mode if needed
	if s.config.EnablePass != "" {
		if err := s.enableMode(); err != nil {
			return fmt.Errorf("failed to enter enable mode: %v", err)
		}
	}

	return nil
}

func (s *SSHConnection) Execute(command string) (string, error) {
	if !s.connected {
		return "", fmt.Errorf("not connected")
	}
	return s.executeInternal(command)
}

func (s *SSHConnection) executeInternal(command string) (string, error) {
	// Send command
	if _, err := s.stdin.Write([]byte(command + "\n")); err != nil {
		return "", fmt.Errorf("failed to send command: %v", err)
	}

	// Read output
	var output bytes.Buffer
	buf := make([]byte, 4096)
	promptFound := false
	timeout := time.After(time.Duration(s.config.Timeout) * time.Second)

	for !promptFound {
		select {
		case <-timeout:
			return "", fmt.Errorf("timeout waiting for command output")
		default:
			n, err := s.stdout.Read(buf)
			if err != nil && err != io.EOF {
				return "", fmt.Errorf("failed to read output: %v", err)
			}
			if n > 0 {
				output.Write(buf[:n])
				// Check for common prompts
				outputStr := output.String()
				if s.isPrompt(outputStr) {
					promptFound = true
				}
			}
			time.Sleep(50 * time.Millisecond)
		}
	}

	// Clean output - remove echo and prompt
	result := s.cleanOutput(output.String(), command)
	return result, nil
}

func (s *SSHConnection) waitForPrompt() error {
	var output bytes.Buffer
	buf := make([]byte, 4096)
	timeout := time.After(time.Duration(s.config.Timeout) * time.Second)

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout waiting for prompt")
		default:
			n, err := s.stdout.Read(buf)
			if err != nil && err != io.EOF {
				return fmt.Errorf("failed to read output: %v", err)
			}
			if n > 0 {
				output.Write(buf[:n])
				if s.isPrompt(output.String()) {
					return nil
				}
			}
			time.Sleep(50 * time.Millisecond)
		}
	}
}

func (s *SSHConnection) isPrompt(output string) bool {
	lines := strings.Split(output, "\n")
	if len(lines) == 0 {
		return false
	}
	lastLine := lines[len(lines)-1]
	
	// Common prompt patterns
	prompts := []string{">", "#", "$ ", "% ", "(enable)", "(config)"}
	for _, prompt := range prompts {
		if strings.HasSuffix(strings.TrimSpace(lastLine), prompt) {
			return true
		}
	}
	return false
}

func (s *SSHConnection) cleanOutput(output, command string) string {
	lines := strings.Split(output, "\n")
	var result []string
	commandFound := false
	
	for i, line := range lines {
		// Skip the command echo line
		if !commandFound && strings.Contains(line, command) {
			commandFound = true
			continue
		}
		
		// Skip the last line if it's a prompt
		if i == len(lines)-1 && s.isPrompt(line) {
			continue
		}
		
		// Skip empty lines at the beginning
		if !commandFound && strings.TrimSpace(line) == "" {
			continue
		}
		
		if commandFound {
			result = append(result, line)
		}
	}
	
	// Remove trailing empty lines
	for len(result) > 0 && strings.TrimSpace(result[len(result)-1]) == "" {
		result = result[:len(result)-1]
	}
	
	return strings.Join(result, "\n")
}

func (s *SSHConnection) enableMode() error {
	// Send enable command
	if _, err := s.stdin.Write([]byte("enable\n")); err != nil {
		return fmt.Errorf("failed to send enable command: %v", err)
	}

	// Wait for password prompt
	time.Sleep(500 * time.Millisecond)
	
	// Send enable password
	if _, err := s.stdin.Write([]byte(s.config.EnablePass + "\n")); err != nil {
		return fmt.Errorf("failed to send enable password: %v", err)
	}

	// Wait for prompt
	return s.waitForPrompt()
}

func (s *SSHConnection) Close() error {
	if s.session != nil {
		s.session.Close()
	}
	if s.client != nil {
		s.client.Close()
	}
	s.connected = false
	return nil
}

// createKeyAuth creates SSH key authentication from the specified key file
func (s *SSHConnection) createKeyAuth() (ssh.AuthMethod, error) {
	keyPath := s.config.KeyFile
	
	// Expand tilde to home directory
	if strings.HasPrefix(keyPath, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, err
		}
		keyPath = filepath.Join(home, keyPath[2:])
	}
	
	// Read private key file
	keyBytes, err := ioutil.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key file %s: %v", keyPath, err)
	}
	
	var signer ssh.Signer
	
	// Try to parse key with passphrase first, then without
	if s.config.KeyPassphrase != "" {
		signer, err = ssh.ParsePrivateKeyWithPassphrase(keyBytes, []byte(s.config.KeyPassphrase))
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key with passphrase: %v", err)
		}
	} else {
		signer, err = ssh.ParsePrivateKey(keyBytes)
		if err != nil {
			// If parsing without passphrase fails, it might be encrypted
			return nil, fmt.Errorf("failed to parse private key (key might be encrypted, use -passphrase): %v", err)
		}
	}
	
	return ssh.PublicKeys(signer), nil
}

// tryDefaultKeys attempts to use default SSH key locations
func (s *SSHConnection) tryDefaultKeys() (ssh.AuthMethod, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	
	// Try common key file locations
	defaultKeys := []string{
		filepath.Join(home, ".ssh", "id_rsa"),
		filepath.Join(home, ".ssh", "id_ed25519"),
		filepath.Join(home, ".ssh", "id_ecdsa"),
		filepath.Join(home, ".ssh", "id_dsa"),
	}
	
	for _, keyPath := range defaultKeys {
		if _, err := os.Stat(keyPath); err != nil {
			continue // Key file doesn't exist
		}
		
		keyBytes, err := ioutil.ReadFile(keyPath)
		if err != nil {
			continue // Can't read key file
		}
		
		signer, err := ssh.ParsePrivateKey(keyBytes)
		if err != nil {
			continue // Can't parse key (might be encrypted)
		}
		
		return ssh.PublicKeys(signer), nil
	}
	
	return nil, fmt.Errorf("no usable default SSH keys found")
}