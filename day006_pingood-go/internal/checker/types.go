package checker

import (
	"time"
)

type NetChecker interface {
	GetIPAddresses(iface string) (string, string, error)
	GetDefaultGateway(iface string) (string, error)
	PingTest(targets []string, count int, interval float64, ipv6 bool) ([]PingResult, error)
	Traceroute(target string, count int, interval float64, expected map[string]string) (TracerouteResult, error)
	CheckDNS(domains []string, recordType string) ([]DNSResult, error)
	CheckHTTP(url string, ipv6 bool) (HTTPResult, error)
}

type PingResult struct {
	Target      string
	Success     bool
	PacketLoss  float64
	MinRTT      time.Duration
	MaxRTT      time.Duration
	AvgRTT      time.Duration
	Error       error
}

type TracerouteResult struct {
	Target          string
	Success         bool
	Hops            []Hop
	PassesExpected  map[string]bool
	Error           error
}

type Hop struct {
	Number  int
	Address string
	RTT     []time.Duration
	Name    string
}

type DNSResult struct {
	Domain     string
	RecordType string
	Success    bool
	Records    []string
	Error      error
}

type HTTPResult struct {
	URL        string
	StatusCode int
	Success    bool
	Duration   time.Duration
	Error      error
}