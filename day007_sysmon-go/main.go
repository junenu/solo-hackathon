package main

import (
	"fmt"
	"log"
	"runtime"
	"time"

	ui "github.com/gizak/termui/v3"
	"github.com/gizak/termui/v3/widgets"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

func main() {
	if err := ui.Init(); err != nil {
		log.Fatalf("failed to initialize termui: %v", err)
	}
	defer ui.Close()

	// CPUゲージ
	cpuGauge := widgets.NewGauge()
	cpuGauge.Title = "CPU Usage"
	cpuGauge.SetRect(0, 0, 50, 3)
	cpuGauge.BarColor = ui.ColorGreen

	// メモリゲージ
	memGauge := widgets.NewGauge()
	memGauge.Title = "Memory Usage"
	memGauge.SetRect(0, 3, 50, 6)
	memGauge.BarColor = ui.ColorBlue

	// システム情報表示
	sysInfo := widgets.NewParagraph()
	sysInfo.Title = "System Info"
	sysInfo.SetRect(0, 6, 50, 12)

	// CPU履歴グラフ
	cpuHistory := widgets.NewPlot()
	cpuHistory.Title = "CPU History"
	cpuHistory.SetRect(50, 0, 100, 12)
	cpuHistory.Data = make([][]float64, 1)
	cpuHistory.Data[0] = []float64{0, 0} // 最低2つの初期値を設定
	cpuHistory.LineColors[0] = ui.ColorCyan

	// 初期描画
	ui.Render(cpuGauge, memGauge, sysInfo, cpuHistory)

	// イベントループ
	uiEvents := ui.PollEvents()
	ticker := time.NewTicker(time.Second).C

	for {
		select {
		case e := <-uiEvents:
			switch e.ID {
			case "q", "<C-c>":
				return
			}
		case <-ticker:
			// CPU使用率を取得
			cpuPercent, err := cpu.Percent(100*time.Millisecond, false)
			if err == nil && len(cpuPercent) > 0 {
				cpuGauge.Percent = int(cpuPercent[0])
				cpuGauge.Label = fmt.Sprintf("%.2f%%", cpuPercent[0])
				
				// CPU履歴を更新
				cpuHistory.Data[0] = append(cpuHistory.Data[0], cpuPercent[0])
				if len(cpuHistory.Data[0]) > 100 {
					cpuHistory.Data[0] = cpuHistory.Data[0][1:]
				}
			}

			// メモリ情報を取得
			memInfo, err := mem.VirtualMemory()
			if err == nil {
				memGauge.Percent = int(memInfo.UsedPercent)
				memGauge.Label = fmt.Sprintf("%.2f%% (%.2f GB / %.2f GB)", 
					memInfo.UsedPercent,
					float64(memInfo.Used)/(1024*1024*1024),
					float64(memInfo.Total)/(1024*1024*1024))
			}

			// システム情報を更新
			sysInfo.Text = fmt.Sprintf(
				"OS: %s\nArch: %s\nCPU Cores: %d\nGoRoutines: %d",
				runtime.GOOS,
				runtime.GOARCH,
				runtime.NumCPU(),
				runtime.NumGoroutine(),
			)

			ui.Render(cpuGauge, memGauge, sysInfo, cpuHistory)
		}
	}
}