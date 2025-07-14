package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

type SessionType string

const (
	WorkSession  SessionType = "work"
	BreakSession SessionType = "break"
)

type Session struct {
	Type      SessionType `json:"type"`
	StartTime time.Time   `json:"start_time"`
	EndTime   time.Time   `json:"end_time"`
	Duration  int         `json:"duration_minutes"`
}

type Pomodoro struct {
	workDuration  time.Duration
	breakDuration time.Duration
	sessions      []Session
	currentType   SessionType
	sessionFile   string
}

func NewPomodoro(workMinutes, breakMinutes int) *Pomodoro {
	homeDir, _ := os.UserHomeDir()
	sessionFile := filepath.Join(homeDir, ".pomodoro_sessions.json")

	p := &Pomodoro{
		workDuration:  time.Duration(workMinutes) * time.Minute,
		breakDuration: time.Duration(breakMinutes) * time.Minute,
		currentType:   WorkSession,
		sessionFile:   sessionFile,
	}

	p.loadSessions()
	return p
}

func (p *Pomodoro) loadSessions() {
	data, err := os.ReadFile(p.sessionFile)
	if err == nil {
		json.Unmarshal(data, &p.sessions)
	}
}

func (p *Pomodoro) saveSessions() {
	data, _ := json.MarshalIndent(p.sessions, "", "  ")
	os.WriteFile(p.sessionFile, data, 0644)
}

func (p *Pomodoro) Start() {
	fmt.Println("🍅 ポモドーロタイマーを開始します")
	fmt.Printf("作業: %d分, 休憩: %d分\n\n", int(p.workDuration.Minutes()), int(p.breakDuration.Minutes()))

	for {
		if p.currentType == WorkSession {
			p.startSession(WorkSession, p.workDuration)
			p.currentType = BreakSession
		} else {
			p.startSession(BreakSession, p.breakDuration)
			p.currentType = WorkSession
		}
	}
}

func (p *Pomodoro) startSession(sessionType SessionType, duration time.Duration) {
	session := Session{
		Type:      sessionType,
		StartTime: time.Now(),
		Duration:  int(duration.Minutes()),
	}

	if sessionType == WorkSession {
		fmt.Println("\n💪 作業セッションを開始！")
	} else {
		fmt.Println("\n☕ 休憩時間です！")
	}

	p.displayTimer(duration)

	session.EndTime = time.Now()
	p.sessions = append(p.sessions, session)
	p.saveSessions()

	p.playNotification()

	if sessionType == WorkSession {
		fmt.Println("\n✅ 作業セッション完了！")
	} else {
		fmt.Println("\n✅ 休憩終了！")
	}

	fmt.Println("スペースキーを押して次のセッションを開始...")
	fmt.Scanln()
}

func (p *Pomodoro) displayTimer(duration time.Duration) {
	totalSeconds := int(duration.Seconds())
	start := time.Now()

	for {
		elapsed := time.Since(start)
		remaining := duration - elapsed

		if remaining <= 0 {
			break
		}

		minutes := int(remaining.Minutes())
		seconds := int(remaining.Seconds()) % 60

		progress := float64(elapsed.Seconds()) / float64(totalSeconds)
		barLength := 30
		filled := int(progress * float64(barLength))

		bar := "["
		for i := 0; i < barLength; i++ {
			if i < filled {
				bar += "█"
			} else {
				bar += "░"
			}
		}
		bar += "]"

		fmt.Printf("\r%s %02d:%02d %s %.0f%%", bar, minutes, seconds, p.getSessionEmoji(), progress*100)

		time.Sleep(1 * time.Second)
	}
	fmt.Println()
}

func (p *Pomodoro) getSessionEmoji() string {
	if p.currentType == WorkSession {
		return "🍅"
	}
	return "☕"
}

func (p *Pomodoro) playNotification() {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("afplay", "/System/Library/Sounds/Glass.aiff")
	case "linux":
		cmd = exec.Command("paplay", "/usr/share/sounds/freedesktop/stereo/complete.oga")
	case "windows":
		cmd = exec.Command("powershell", "-c", "[console]::beep(1000,500)")
	}

	if cmd != nil {
		cmd.Run()
	}

	fmt.Print("\a")
}

func (p *Pomodoro) ShowStats() {
	today := time.Now().Format("2006-01-02")
	todayWork := 0
	todayBreak := 0
	totalWork := 0
	totalBreak := 0

	for _, session := range p.sessions {
		if session.Type == WorkSession {
			totalWork += session.Duration
			if session.StartTime.Format("2006-01-02") == today {
				todayWork += session.Duration
			}
		} else {
			totalBreak += session.Duration
			if session.StartTime.Format("2006-01-02") == today {
				todayBreak += session.Duration
			}
		}
	}

	fmt.Println("📊 ポモドーロ統計")
	fmt.Println("================")
	fmt.Printf("今日の作業時間: %d分\n", todayWork)
	fmt.Printf("今日の休憩時間: %d分\n", todayBreak)
	fmt.Printf("今日のセッション数: %d\n", todayWork/25)
	fmt.Println("----------------")
	fmt.Printf("累計作業時間: %d時間%d分\n", totalWork/60, totalWork%60)
	fmt.Printf("累計休憩時間: %d時間%d分\n", totalBreak/60, totalBreak%60)
	fmt.Printf("累計セッション数: %d\n", len(p.sessions)/2)
}

func main() {
	var (
		workMinutes  = flag.Int("work", 25, "作業時間（分）")
		breakMinutes = flag.Int("break", 5, "休憩時間（分）")
		showStats    = flag.Bool("stats", false, "統計を表示")
	)
	flag.Parse()

	pomodoro := NewPomodoro(*workMinutes, *breakMinutes)

	if *showStats {
		pomodoro.ShowStats()
		return
	}

	pomodoro.Start()
}