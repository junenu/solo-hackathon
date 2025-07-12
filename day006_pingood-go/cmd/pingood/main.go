package main

import (
	"flag"
	"fmt"
	"log"
	"runtime"
	"time"

	"github.com/junenu/solo-hackathon/day006_pingood-go/internal/checker"
	"github.com/junenu/solo-hackathon/day006_pingood-go/internal/config"
)

func main() {
	var (
		iface      string
		configPath string
	)

	flag.StringVar(&iface, "i", getDefaultInterface(), "Network interface to check")
	flag.StringVar(&configPath, "c", "conf.yaml", "Path to configuration file")
	flag.Parse()

	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		log.Printf("Warning: Failed to load config file: %v. Using default configuration.", err)
		cfg = config.DefaultConfig()
	}

	netChecker := checker.New()

	fmt.Printf("=== Network Diagnostics Tool (pingood-go) ===\n")
	fmt.Printf("Platform: %s/%s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("Interface: %s\n", iface)
	fmt.Printf("Time: %s\n\n", time.Now().Format("2006-01-02 15:04:05"))

	runDiagnostics(netChecker, cfg, iface)
}

func getDefaultInterface() string {
	switch runtime.GOOS {
	case "darwin":
		return "en0"
	case "linux":
		return "eth0"
	default:
		return "eth0"
	}
}

func runDiagnostics(nc checker.NetChecker, cfg *config.Config, iface string) {
	fmt.Println("1. IP Address Check")
	fmt.Println("==================")
	ipv4, ipv6, err := nc.GetIPAddresses(iface)
	if err != nil {
		fmt.Printf("❌ Failed to get IP addresses: %v\n", err)
	} else {
		if ipv4 != "" {
			fmt.Printf("✅ IPv4: %s\n", ipv4)
		} else {
			fmt.Printf("❌ IPv4: Not found\n")
		}
		if ipv6 != "" {
			fmt.Printf("✅ IPv6: %s\n", ipv6)
		} else {
			fmt.Printf("❌ IPv6: Not found\n")
		}
	}
	fmt.Println()

	fmt.Println("2. Default Gateway Check")
	fmt.Println("========================")
	gateway, err := nc.GetDefaultGateway(iface)
	if err != nil {
		fmt.Printf("❌ Failed to get default gateway: %v\n", err)
	} else {
		fmt.Printf("✅ Gateway: %s\n", gateway)
	}
	fmt.Println()

	fmt.Println("3. ICMP Ping Test (IPv4)")
	fmt.Println("========================")
	pingResults, err := nc.PingTest(cfg.PingTargetsIPv4, cfg.PingCount, cfg.PingInterval, false)
	if err != nil {
		fmt.Printf("❌ Ping test failed: %v\n", err)
	} else {
		for _, result := range pingResults {
			if result.Success {
				fmt.Printf("✅ %s: %.1f%% packet loss, RTT min/avg/max = %.1f/%.1f/%.1f ms\n",
					result.Target, result.PacketLoss,
					float64(result.MinRTT)/float64(time.Millisecond),
					float64(result.AvgRTT)/float64(time.Millisecond),
					float64(result.MaxRTT)/float64(time.Millisecond))
			} else {
				fmt.Printf("❌ %s: Failed", result.Target)
				if result.Error != nil {
					fmt.Printf(" - %v", result.Error)
				}
				fmt.Println()
			}
		}
	}
	fmt.Println()

	fmt.Println("4. ICMP Ping Test (IPv6)")
	fmt.Println("========================")
	pingResults6, err := nc.PingTest(cfg.PingTargetsIPv6, cfg.PingCount, cfg.PingInterval, true)
	if err != nil {
		fmt.Printf("❌ IPv6 ping test failed: %v\n", err)
	} else {
		for _, result := range pingResults6 {
			if result.Success {
				fmt.Printf("✅ %s: %.1f%% packet loss, RTT min/avg/max = %.1f/%.1f/%.1f ms\n",
					result.Target, result.PacketLoss,
					float64(result.MinRTT)/float64(time.Millisecond),
					float64(result.AvgRTT)/float64(time.Millisecond),
					float64(result.MaxRTT)/float64(time.Millisecond))
			} else {
				fmt.Printf("❌ %s: Failed", result.Target)
				if result.Error != nil {
					fmt.Printf(" - %v", result.Error)
				}
				fmt.Println()
			}
		}
	}
	fmt.Println()

	fmt.Println("5. Traceroute Test")
	fmt.Println("==================")
	traceResult, err := nc.Traceroute(cfg.TracerouteTarget, cfg.TracerouteCount, cfg.TracerouteInterval, cfg.ViaNetworkDevices)
	if err != nil {
		fmt.Printf("❌ Traceroute failed: %v\n", err)
	} else {
		fmt.Printf("Target: %s\n", traceResult.Target)
		fmt.Printf("Hops:\n")
		for _, hop := range traceResult.Hops {
			fmt.Printf("  %2d. %s (%s)", hop.Number, hop.Address, hop.Name)
			if len(hop.RTT) > 0 {
				fmt.Printf(" -")
				for _, rtt := range hop.RTT {
					fmt.Printf(" %.1f ms", float64(rtt)/float64(time.Millisecond))
				}
			}
			fmt.Println()
		}
		fmt.Printf("\nExpected network devices:\n")
		for device, passed := range traceResult.PassesExpected {
			if passed {
				fmt.Printf("  ✅ %s: Passed\n", device)
			} else {
				fmt.Printf("  ❌ %s: Not found\n", device)
			}
		}
	}
	fmt.Println()

	fmt.Println("6. DNS Resolution Test (A Records)")
	fmt.Println("==================================")
	dnsResults, err := nc.CheckDNS(cfg.DomainARecords, "A")
	if err != nil {
		fmt.Printf("❌ DNS check failed: %v\n", err)
	} else {
		for _, result := range dnsResults {
			if result.Success {
				fmt.Printf("✅ %s: %v\n", result.Domain, result.Records)
			} else {
				fmt.Printf("❌ %s: Failed", result.Domain)
				if result.Error != nil {
					fmt.Printf(" - %v", result.Error)
				}
				fmt.Println()
			}
		}
	}
	fmt.Println()

	fmt.Println("7. DNS Resolution Test (AAAA Records)")
	fmt.Println("=====================================")
	dnsResults6, err := nc.CheckDNS(cfg.DomainAAAARecords, "AAAA")
	if err != nil {
		fmt.Printf("❌ DNS IPv6 check failed: %v\n", err)
	} else {
		for _, result := range dnsResults6 {
			if result.Success {
				fmt.Printf("✅ %s: %v\n", result.Domain, result.Records)
			} else {
				fmt.Printf("❌ %s: Failed", result.Domain)
				if result.Error != nil {
					fmt.Printf(" - %v", result.Error)
				}
				fmt.Println()
			}
		}
	}
	fmt.Println()

	fmt.Println("8. HTTP Connectivity Test (IPv4)")
	fmt.Println("=================================")
	httpResult, err := nc.CheckHTTP(cfg.HTTPIPv4Target, false)
	if err != nil {
		fmt.Printf("❌ %s: Failed - %v\n", httpResult.URL, err)
	} else {
		if httpResult.Success {
			fmt.Printf("✅ %s: Status %d, Time %.2fs\n", httpResult.URL, httpResult.StatusCode, httpResult.Duration.Seconds())
		} else {
			fmt.Printf("❌ %s: Status %d\n", httpResult.URL, httpResult.StatusCode)
		}
	}
	fmt.Println()

	fmt.Println("9. HTTP Connectivity Test (IPv6)")
	fmt.Println("=================================")
	httpResult6, err := nc.CheckHTTP(cfg.HTTPIPv6Target, true)
	if err != nil {
		fmt.Printf("❌ %s: Failed - %v\n", httpResult6.URL, err)
	} else {
		if httpResult6.Success {
			fmt.Printf("✅ %s: Status %d, Time %.2fs\n", httpResult6.URL, httpResult6.StatusCode, httpResult6.Duration.Seconds())
		} else {
			fmt.Printf("❌ %s: Status %d\n", httpResult6.URL, httpResult6.StatusCode)
		}
	}
	fmt.Println()

	fmt.Println("=== Diagnostics Complete ===")
}