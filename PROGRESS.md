# Solo Hackathon Progress

## Day 019 - 2025/07/26
- **プロダクト**: day019_mcp-server
- **概要**: Model Context Protocol (MCP) サーバーのTypeScript実装。各種ツールとリソースを提供
- **使用技術**: TypeScript, @modelcontextprotocol/sdk, Node.js
- **実装内容**:
  - MCPプロトコル準拠のサーバー実装
  - 3つのツール実装（calculate: 数式計算、fetch_url: URL取得、uppercase: 大文字変換）
  - 2つのリソース実装（greeting: 挨拶メッセージ、time: 現在時刻）
  - StdioServerTransportによるstdio通信
  - エラーハンドリングと型安全な実装
  - テスト用クライアントの実装
  - Claude Desktopとの統合対応
- **学んだこと**:
  - MCP SDKを使ったサーバー開発
  - ツールとリソースの違いと実装方法
  - stdio通信によるプロセス間通信
  - Claude DesktopへのMCPサーバー統合方法

## Day 018 - 2025/07/25
- **プロダクト**: day018_kanban-board
- **概要**: ドラッグ&ドロップ対応のカンバンボードタスク管理ツール
- **使用技術**: TypeScript, Next.js 14 (App Router), React DnD, Tailwind CSS
- **実装内容**:
  - ドラッグ&ドロップによるタスクの移動
  - 3つのステータス（Todo, In Progress, Done）
  - タスクの追加・編集・削除機能
  - ローカルストレージによるデータ永続化
  - レスポンシブデザイン
  - モーダルによるタスク詳細編集
- **学んだこと**:
  - React DnDを使ったドラッグ&ドロップ実装
  - Next.js App Routerでのクライアントコンポーネント設計
  - カスタムフックによる状態管理
  - Tailwind CSSでのレスポンシブデザイン

## Day 017 - 2025/07/23
- **プロダクト**: day017_task-tracker-api
- **概要**: RESTful タスク管理API。SQLiteを使ったCRUD操作とフィルタリング機能を提供
- **使用技術**: TypeScript, Express, SQLite3, tsx
- **実装内容**:
  - タスクのCRUD操作（作成・読み取り・更新・削除）
  - カテゴリ別管理機能
  - 優先度設定（low/medium/high）
  - ステータス管理（todo/in_progress/done）
  - 期限設定と管理
  - 検索・フィルタリング機能（ステータス、優先度、カテゴリ、キーワード）
  - SQLiteデータベース使用
  - RESTful API設計
- **学んだこと**:
  - Express.jsによるREST API実装
  - SQLiteでのデータベース操作とマイグレーション
  - TypeScriptでの型安全なAPI開発
  - クエリパラメータによる動的フィルタリング実装

## Day 016 - 2025/07/22
- **プロダクト**: day016_port-scanner
- **概要**: 高速なTCPポートスキャナーCLIツール。並行処理により効率的にポートをスキャン
- **使用技術**: TypeScript, Node.js, Commander.js, chalk, ora
- **実装内容**:
  - TCP接続によるポートスキャン
  - 並行処理による高速スキャン（同時接続数の調整可能）
  - よく使われるポートの自動識別（SSH、HTTP、HTTPS、MySQL等）
  - 複数の出力形式（テーブル、JSON、CSV、シンプル）
  - カスタマイズ可能なタイムアウト設定
  - ポート範囲指定・個別ポート指定のサポート
  - プログレス表示（ora）
  - 結果のファイル出力機能
- **学んだこと**:
  - Node.jsのnetモジュールによるTCPソケット操作
  - 並行処理によるパフォーマンス最適化
  - CLIツールのUX設計（プログレス表示、カラー出力）
  - 非同期処理のバッチ実行パターン

## Day 015 - 2025/07/21
- **プロダクト**: day015_netcli (crun)
- **概要**: AIに利用しやすいクリーンな出力を提供するCisco機器接続ツール（rancid cloginのGo実装）
- **使用技術**: Go, golang.org/x/crypto/ssh
- **実装内容**:
  - SSH接続によるネットワーク機器へのログイン
  - コマンド実行と出力のクリーンアップ（余計なログを排除）
  - 設定ファイル（.crunrc）によるホスト別認証情報管理
  - Enableモードのサポート
  - ターミナルページネーション無効化
  - 複数コマンドの連続実行
  - JSON形式での出力
  - 複数ホスト対応（並列・逐次実行）
  - SSH鍵認証のサポート（RSA、Ed25519、ECDSA、DSA）
  - パスフレーズ付きSSH鍵のサポート
- **学んだこと**:
  - golang.org/x/crypto/sshパッケージによるSSHクライアント実装
  - ネットワーク機器のプロンプト検出とパース処理
  - AI利用を考慮したCLIツール設計
  - 設定ファイルのセキュアな管理（600パーミッション）

## Day 014 - 2025/07/20
- **プロダクト**: day014_mac-address-highlighter
- **概要**: Webページ上のMACアドレスを検出してハイライト表示するChrome拡張機能
- **使用技術**: JavaScript, Chrome Extensions API (Manifest V3)
- **実装内容**:
  - 複数形式のMACアドレス検出（XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXX.XXXX.XXXX, XXXXXXXXXXXX）
  - リアルタイムハイライト表示機能
  - ポップアップUIでのON/OFF切り替え
  - ハイライト色のカスタマイズ機能
  - 検出したMACアドレス数の表示
  - 設定の永続化（Chrome Storage API）
- **学んだこと**:
  - Chrome拡張機能の開発（Manifest V3）
  - Content Scriptによるページ内容の動的変更
  - 正規表現による複数パターンのマッチング
  - Chrome Storage APIを使った設定の保存

## Day 013 - 2025/07/19
- **プロダクト**: day013_ipaddr-ext
- **概要**: IPアドレス操作ライブラリ（Ruby ipaddr-extのTypeScript版）
- **使用技術**: TypeScript, Jest
- **実装内容**:
  - IPv4/IPv6アドレスのパースと操作
  - CIDR記法のサポート
  - アドレスの算術演算（加算・減算）
  - ブロードキャストアドレス取得（IPv4）
  - ワイルドカードマスク計算（IPv4）
  - ホストアドレスへの変換
  - プレフィックス付きJSON出力
  - IPv6アドレスの省略形式対応（::記法）
- **学んだこと**:
  - TypeScriptでのビット演算とBigInt活用
  - IPv6アドレスの正規化と省略形式への変換
  - IPアドレスのバイナリ表現とマスク計算
  - Jestによる包括的なテストケース作成

## Day 012 - 2025/07/17
- **プロダクト**: day012_timeline-sns
- **概要**: リアルタイムタイムライン機能を持つSNSアプリケーション
- **使用技術**: TypeScript, React, Node.js, Socket.IO, Express, SQLite
- **実装内容**:
  - ユーザー認証（JWT）
  - 投稿の作成・表示（リアルタイム更新）
  - フォロー/フォロワー機能
  - タイムライン（フォローしているユーザーの投稿表示）
  - WebSocketによるリアルタイム通信
- **学んだこと**:
  - Socket.IOによるリアルタイム双方向通信
  - JWTを使った認証実装
  - SQLiteでのリレーショナルデータ管理
  - React HooksとContext APIの活用

## Day 011 - 2025/07/17
- **プロダクト**: day011_network-checker
- **概要**: Electronで作成したGUI版ネットワーク接続性チェッカー
- **使用技術**: TypeScript, Electron, React, Material-UI
- **実装内容**:
  - 複数ホストへのping実行と結果表示
  - レスポンスタイムの履歴グラフ表示
  - DNS解決機能
  - カスタムDNSサーバー設定
  - エクスポート機能（CSV/JSON）
  - ダークモード対応
- **学んだこと**:
  - ElectronでのIPC通信とセキュリティ設定
  - node:dnsとnode:net APIの活用
  - Material-UIを使ったレスポンシブデザイン
  - Rechartsによるデータビジュアライゼーション

## Day 010 - 2025/07/16
- **プロダクト**: day010_csv-tool
- **概要**: CSVファイルに対してフィルタリング、ソート、集計を行うコマンドラインツール
- **使用技術**: Ruby
- **実装内容**:
  - CSVファイルの内容を見やすいテーブル形式で表示
  - カラム指定によるフィルタリング機能（部分一致・完全一致）
  - カラム指定によるソート機能（文字列・数値、昇順・降順）
  - 数値カラムの集計機能（sum, avg, count, min, max）
  - グループ化による集計機能
  - Thorを使用したCLIインターフェース
- **学んだこと**:
  - RubyでのCSV操作とデータ処理
  - ThorによるCLIツール構築
  - グループ化集計の実装パターン
  - スタンドアロン実行可能なRubyスクリプトの作成

## Day 009 - 2025/07/15
- **プロダクト**: day009_encrypted-notes
- **概要**: AES-256暗号化を使用したセキュアなメモ帳アプリケーション
- **使用技術**: Go
- **実装内容**:
  - AES-256-CFB暗号化によるメモの保護
  - パスワードベースの認証とキー導出（SHA-256）
  - メモの追加・一覧表示・閲覧・削除機能
  - セキュアなパスワード入力（画面表示なし）
  - JSONフォーマットでの暗号化データ保存
- **学んだこと**:
  - Goでの暗号化実装（crypto/aes, crypto/cipher）
  - セキュアなパスワード入力処理（golang.org/x/term）
  - 暗号化ファイルの権限管理（600）
  - IVを使用したCFBモードの実装

## Day 008 - 2025/07/14
- **プロダクト**: day008_pomodoro-timer
- **概要**: ポモドーロテクニック用CLIタイマーアプリケーション。25分作業・5分休憩のサイクル管理
- **使用技術**: Go
- **実装内容**:
  - カスタマイズ可能なタイマー機能（作業時間・休憩時間の設定）
  - プログレスバーによる視覚的な進捗表示
  - OS別の通知音再生（macOS/Linux/Windows対応）
  - セッション履歴の記録と統計表示機能
  - JSONファイルへの自動保存
- **学んだこと**:
  - Goでの時間管理とタイマー実装
  - ターミナルでのリアルタイム表示更新処理
  - クロスプラットフォーム対応の通知実装
  - JSONファイルを使った簡易データ永続化

## Day 007 - 2025/07/13
- **プロダクト**: day007_sysmon-go
- **概要**: Golangで実装したシステムモニター。ターミナルUIでCPU使用率、メモリ使用率をリアルタイムに表示
- **使用技術**: Go, termui v3, gopsutil v3
- **実装内容**:
  - CPU使用率のゲージ表示と履歴グラフ
  - メモリ使用率と使用量/総容量の表示
  - システム情報（OS、アーキテクチャ、CPUコア数）の表示
  - 1秒ごとの自動更新
- **学んだこと**:
  - termuiライブラリを使ったターミナルUI構築
  - gopsutilによるクロスプラットフォームなシステム情報取得
  - Goでのリアルタイムデータ更新処理

## Day 006 - [日付]
- **プロダクト**: day006_pingood-go
- **概要**: Golangで作成したネットワーク疎通確認ツール

## Day 005 - [日付]
- **プロダクト**: day005_fortune_app
- **概要**: 今日の運勢占いアプリ

## Day 004 - [日付]
- **プロダクト**: day004_ai-chatbot-hitl
- **概要**: Human-in-the-loopを取り入れたAIチャットボット

## Day 003 - [日付]
- **プロダクト**: day003_password-checker
- **概要**: 正規表現を使用したパスワード強度チェッカー

## Day 002 - [日付]
- **プロダクト**: day002_ai-chatbot-streaming
- **概要**: OpenAI Agentsを使用したストリーミングAIチャットボット

## Day 001 - [日付]
- **プロダクト**: day001_ai-chatbot
- **概要**: openai-nodeを使用したAIチャットボット