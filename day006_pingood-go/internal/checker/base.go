package checker

import (
	"bufio"
	"bytes"
	"fmt"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
	"time"
)

type BaseChecker struct{}

func New() NetChecker {
	switch runtime.GOOS {
	case "linux":
		return &LinuxChecker{BaseChecker{}}
	case "darwin":
		return &MacChecker{BaseChecker{}}
	default:
		return &LinuxChecker{BaseChecker{}}
	}
}

func (b *BaseChecker) executeCommand(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("command failed: %s: %w, stderr: %s", name, err, stderr.String())
	}
	
	return out.String(), nil
}

func (b *BaseChecker) parsePingOutput(output string) PingResult {
	result := PingResult{Success: false}
	
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "packet loss") {
			re := regexp.MustCompile(`(\d+(?:\.\d+)?)% packet loss`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 1 {
				fmt.Sscanf(matches[1], "%f", &result.PacketLoss)
				result.Success = result.PacketLoss < 100
			}
		}
		
		if strings.Contains(line, "min/avg/max") {
			re := regexp.MustCompile(`(\d+\.?\d*)/(\d+\.?\d*)/(\d+\.?\d*)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 3 {
				var min, avg, max float64
				fmt.Sscanf(matches[1], "%f", &min)
				fmt.Sscanf(matches[2], "%f", &avg)
				fmt.Sscanf(matches[3], "%f", &max)
				result.MinRTT = time.Duration(min * float64(time.Millisecond))
				result.AvgRTT = time.Duration(avg * float64(time.Millisecond))
				result.MaxRTT = time.Duration(max * float64(time.Millisecond))
			}
		}
	}
	
	return result
}

func (b *BaseChecker) parseTracerouteOutput(output string, expected map[string]string) TracerouteResult {
	result := TracerouteResult{
		Success:        true,
		PassesExpected: make(map[string]bool),
	}
	
	for device := range expected {
		result.PassesExpected[device] = false
	}
	
	scanner := bufio.NewScanner(strings.NewReader(output))
	hopNumber := 0
	
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		
		re := regexp.MustCompile(`^\s*(\d+)\s+([^\s]+)\s+\(([^)]+)\)`)
		matches := re.FindStringSubmatch(line)
		
		if len(matches) > 3 {
			hopNumber++
			hop := Hop{
				Number:  hopNumber,
				Name:    matches[2],
				Address: matches[3],
			}
			
			rtts := regexp.MustCompile(`(\d+\.?\d*)\s*ms`).FindAllStringSubmatch(line, -1)
			for _, rtt := range rtts {
				if len(rtt) > 1 {
					var ms float64
					fmt.Sscanf(rtt[1], "%f", &ms)
					hop.RTT = append(hop.RTT, time.Duration(ms*float64(time.Millisecond)))
				}
			}
			
			result.Hops = append(result.Hops, hop)
			
			for device, addr := range expected {
				if hop.Address == addr || hop.Name == addr {
					result.PassesExpected[device] = true
				}
			}
		}
	}
	
	return result
}