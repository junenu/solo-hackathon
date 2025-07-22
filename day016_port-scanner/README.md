# Port Scanner

高速なTCPポートスキャナーCLIツール

## 概要（What）

指定されたホストの開いているポートを検出するコマンドラインツールです。並行処理により高速にスキャンし、結果を見やすく表示します。

### 主な機能
- TCP/UDPポートスキャン
- 並行処理による高速スキャン（同時接続数の調整可能）
- よく使われるポートの自動識別
- 複数の出力形式（テーブル、JSON、CSV、シンプル）
- タイムアウト設定
- ファイル出力対応

## セットアップ方法（How to install）

```bash
# 依存関係のインストール
npm install

# TypeScriptのビルド
npm run build
```

## 使い方（How to use）

### 基本的な使い方

```bash
# 指定したホストの一般的なポートをスキャン
npm start localhost --common

# 特定のポートをスキャン
npm start example.com -p 80,443,8080

# ポート範囲を指定してスキャン
npm start 192.168.1.1 -r 1-1000

# 全ポートスキャン（時間がかかります）
npm start example.com -r 1-65535 -c 100
```

### オプション

- `-p, --ports <ports>`: スキャンする特定のポート（カンマ区切り）
- `-r, --range <start-end>`: スキャンするポート範囲（デフォルト: 1-1000）
- `-t, --timeout <ms>`: 接続タイムアウト（ミリ秒、デフォルト: 1000）
- `-c, --concurrency <n>`: 同時接続数（デフォルト: 50）
- `-f, --format <format>`: 出力形式（table, json, csv, simple）
- `-o, --output <file>`: 結果をファイルに保存
- `--common`: よく使われるポートのみスキャン

### 使用例

```bash
# JSON形式で出力
npm start google.com --common -f json

# CSVファイルに保存
npm start 192.168.1.1 -r 1-1000 -f csv -o scan_results.csv

# 高速スキャン（同時接続数を増やす）
npm start example.com -r 1-10000 -c 200 -t 500
```

## 改善予定

- UDPポートスキャン対応
- サービスバージョン検出
- OS検出機能
- スキャン進捗のリアルタイム表示
- 複数ホストの同時スキャン