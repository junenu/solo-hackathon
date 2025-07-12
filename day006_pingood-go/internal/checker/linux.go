package checker

import (
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type LinuxChecker struct {
	BaseChecker
}

func (l *LinuxChecker) GetIPAddresses(iface string) (string, string, error) {
	var ipv4, ipv6 string
	
	output, err := l.executeCommand("ip", "addr", "show", iface)
	if err != nil {
		return "", "", fmt.Errorf("failed to get IP addresses: %w", err)
	}
	
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		if strings.HasPrefix(line, "inet ") && !strings.Contains(line, "127.0.0.1") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				ipv4 = strings.Split(fields[1], "/")[0]
			}
		}
		
		if strings.HasPrefix(line, "inet6 ") && !strings.Contains(line, "fe80") && !strings.Contains(line, "::1") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				ipv6 = strings.Split(fields[1], "/")[0]
			}
		}
	}
	
	if ipv4 == "" && ipv6 == "" {
		return "", "", fmt.Errorf("no IP addresses found for interface %s", iface)
	}
	
	return ipv4, ipv6, nil
}

func (l *LinuxChecker) GetDefaultGateway(iface string) (string, error) {
	output, err := l.executeCommand("ip", "route", "show", "default", "dev", iface)
	if err != nil {
		return "", fmt.Errorf("failed to get default gateway: %w", err)
	}
	
	re := regexp.MustCompile(`default via (\S+)`)
	matches := re.FindStringSubmatch(output)
	if len(matches) > 1 {
		return matches[1], nil
	}
	
	return "", fmt.Errorf("no default gateway found for interface %s", iface)
}

func (l *LinuxChecker) PingTest(targets []string, count int, interval float64, ipv6 bool) ([]PingResult, error) {
	var results []PingResult
	
	pingCmd := "ping"
	if ipv6 {
		pingCmd = "ping6"
	}
	
	for _, target := range targets {
		args := []string{"-c", fmt.Sprintf("%d", count), "-i", fmt.Sprintf("%.1f", interval), target}
		output, err := l.executeCommand(pingCmd, args...)
		
		result := l.parsePingOutput(output)
		result.Target = target
		if err != nil {
			result.Error = err
			result.Success = false
		}
		
		results = append(results, result)
		
		time.Sleep(time.Duration(interval) * time.Second)
	}
	
	return results, nil
}

func (l *LinuxChecker) Traceroute(target string, count int, interval float64, expected map[string]string) (TracerouteResult, error) {
	output, err := l.executeCommand("traceroute", "-n", "-q", fmt.Sprintf("%d", count), target)
	if err != nil {
		return TracerouteResult{Target: target, Success: false, Error: err}, err
	}
	
	result := l.parseTracerouteOutput(output, expected)
	result.Target = target
	
	return result, nil
}

func (l *LinuxChecker) CheckDNS(domains []string, recordType string) ([]DNSResult, error) {
	var results []DNSResult
	
	for _, domain := range domains {
		args := []string{"+short", domain}
		if recordType != "" {
			args = append(args, recordType)
		}
		
		output, err := l.executeCommand("dig", args...)
		
		result := DNSResult{
			Domain:     domain,
			RecordType: recordType,
			Success:    err == nil && output != "",
			Error:      err,
		}
		
		if result.Success {
			records := strings.Split(strings.TrimSpace(output), "\n")
			for _, record := range records {
				if record != "" {
					result.Records = append(result.Records, record)
				}
			}
		}
		
		results = append(results, result)
	}
	
	return results, nil
}

func (l *LinuxChecker) CheckHTTP(url string, ipv6 bool) (HTTPResult, error) {
	result := HTTPResult{URL: url}
	
	dialer := &net.Dialer{
		Timeout: 30 * time.Second,
	}
	
	if ipv6 {
		dialer.FallbackDelay = -1
	}
	
	transport := &http.Transport{
		DialContext: dialer.DialContext,
	}
	
	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}
	
	start := time.Now()
	resp, err := client.Get(url)
	result.Duration = time.Since(start)
	
	if err != nil {
		result.Error = err
		result.Success = false
		return result, err
	}
	defer resp.Body.Close()
	
	result.StatusCode = resp.StatusCode
	result.Success = resp.StatusCode >= 200 && resp.StatusCode < 300
	
	return result, nil
}