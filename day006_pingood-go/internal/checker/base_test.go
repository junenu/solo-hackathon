package checker

import (
	"testing"
	"time"
)

func TestParsePingOutput(t *testing.T) {
	base := &BaseChecker{}

	pingOutput := `PING 8.8.8.8 (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: icmp_seq=0 ttl=58 time=15.123 ms
64 bytes from 8.8.8.8: icmp_seq=1 ttl=58 time=16.456 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=58 time=14.789 ms

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 received, 0.0% packet loss
round-trip min/avg/max/stddev = 14.789/15.456/16.456/0.697 ms`

	result := base.parsePingOutput(pingOutput)

	if !result.Success {
		t.Error("Expected ping to be successful")
	}

	if result.PacketLoss != 0.0 {
		t.Errorf("Expected 0.0%% packet loss, got %.1f%%", result.PacketLoss)
	}

	expectedMin := time.Duration(14.789 * float64(time.Millisecond))
	expectedAvg := time.Duration(15.456 * float64(time.Millisecond))
	expectedMax := time.Duration(16.456 * float64(time.Millisecond))

	tolerance := time.Millisecond

	if abs(result.MinRTT-expectedMin) > tolerance {
		t.Errorf("Expected MinRTT=%v, got %v", expectedMin, result.MinRTT)
	}

	if abs(result.AvgRTT-expectedAvg) > tolerance {
		t.Errorf("Expected AvgRTT=%v, got %v", expectedAvg, result.AvgRTT)
	}

	if abs(result.MaxRTT-expectedMax) > tolerance {
		t.Errorf("Expected MaxRTT=%v, got %v", expectedMax, result.MaxRTT)
	}
}

func TestParsePingOutputWithLoss(t *testing.T) {
	base := &BaseChecker{}

	pingOutput := `PING 192.168.1.999 (192.168.1.999): 56 data bytes

--- 192.168.1.999 ping statistics ---
3 packets transmitted, 0 received, 100.0% packet loss`

	result := base.parsePingOutput(pingOutput)

	if result.Success {
		t.Error("Expected ping to fail with 100% packet loss")
	}

	if result.PacketLoss != 100.0 {
		t.Errorf("Expected 100.0%% packet loss, got %.1f%%", result.PacketLoss)
	}
}

func TestParseTracerouteOutput(t *testing.T) {
	base := &BaseChecker{}

	tracerouteOutput := ` 1  192.168.1.1 (192.168.1.1)  1.234 ms  1.123 ms  1.345 ms
 2  10.0.0.1 (10.0.0.1)  5.678 ms  5.567 ms  5.789 ms
 3  203.0.113.1 (203.0.113.1)  15.123 ms  14.987 ms  15.234 ms`

	expected := map[string]string{
		"router":  "192.168.1.1",
		"gateway": "10.0.0.1",
	}

	result := base.parseTracerouteOutput(tracerouteOutput, expected)

	if !result.Success {
		t.Error("Expected traceroute to be successful")
	}

	if len(result.Hops) != 3 {
		t.Errorf("Expected 3 hops, got %d", len(result.Hops))
	}

	if result.Hops[0].Address != "192.168.1.1" {
		t.Errorf("Expected first hop address=192.168.1.1, got %s", result.Hops[0].Address)
	}

	if !result.PassesExpected["router"] {
		t.Error("Expected router to be found in traceroute")
	}

	if !result.PassesExpected["gateway"] {
		t.Error("Expected gateway to be found in traceroute")
	}
}

func abs(d time.Duration) time.Duration {
	if d < 0 {
		return -d
	}
	return d
}