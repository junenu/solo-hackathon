# pingood-go

Go言語で作成されたネットワーク疎通確認ツール。オリジナルのPython版 [pingood](https://github.com/junenu/pingood) からインスパイアされています。

## 概要

このツールは、ネットワークの接続状況を包括的に診断するための9つのテストを実行します：

1. **IPアドレス確認** - IPv4/IPv6アドレスの取得
2. **デフォルトゲートウェイ確認** - ゲートウェイの特定
3. **ICMP Ping テスト (IPv4)** - IPv4接続性の確認
4. **ICMP Ping テスト (IPv6)** - IPv6接続性の確認
5. **Tracerouteテスト** - ネットワーク経路の確認
6. **DNS名前解決テスト (Aレコード)** - IPv4 DNS解決
7. **DNS名前解決テスト (AAAAレコード)** - IPv6 DNS解決
8. **HTTP接続テスト (IPv4)** - IPv4 HTTP接続性
9. **HTTP接続テスト (IPv6)** - IPv6 HTTP接続性

## 使用技術

- **言語**: Go 1.21
- **設定**: YAML
- **対応OS**: Linux, macOS
- **ビルドツール**: Make

## 実装した機能

- **クロスプラットフォーム対応**: Linux/macOS両対応
- **設定可能**: YAML設定ファイルによる柔軟な設定
- **単一バイナリ**: 依存関係なしの静的バイナリ
- **包括的テスト**: 9種類のネットワーク診断
- **詳細レポート**: わかりやすい結果表示
- **エラーハンドリング**: 詳細なエラー情報

## インストール

### ソースからビルド

```bash
git clone https://github.com/junenu/solo-hackathon.git
cd solo-hackathon/day006_pingood-go
make build
```

### システムにインストール

```bash
make install
```

`pingood`バイナリが`/usr/local/bin/`にインストールされます。

## 使い方

### 基本的な使用方法

```bash
# デフォルトインターフェース使用 (Linuxではeth0、macOSではen0)
./bin/pingood

# ネットワークインターフェースを指定
./bin/pingood -i wlan0

# 設定ファイルを指定
./bin/pingood -c /path/to/custom-conf.yaml
```

### コマンドラインオプション

- `-i <interface>`: 確認するネットワークインターフェース (デフォルト: eth0/en0)
- `-c <config>`: 設定ファイルのパス (デフォルト: conf.yaml)

### Makeコマンドの使用

```bash
# 自動検出インターフェースでビルド・実行
make run

# ユーザー指定インターフェースでビルド・実行
make run-interface

# 複数プラットフォーム向けビルド
make build-all

# テスト実行
make test

# 利用可能なコマンド表示
make help
```

## 設定

ツールはYAML設定ファイル（デフォルト：`conf.yaml`）を使用してテストパラメータを定義します：

```yaml
# ICMP パラメータ
PING_COUNT: 3
PING_INTERVAL: 0.5
PING_TARGETS_IPV4:
  - '8.8.8.8'
  - '1.1.1.1'
PING_TARGETS_IPV6:
  - '2001:4860:4860::8888'
  - '2606:4700:4700::1111'

# Traceroute パラメータ
TRACEROUTE_COUNT: 3
TRACEROUTE_INTERVAL: 1.0
TRACEROUTE_TARGET: '8.8.8.8'
VIA_NW_DEVICES:
  router: '192.168.1.1'
  gateway: '10.0.0.1'

# DNS確認パラメータ
DOMAIN_A_RECORDS:
  - 'google.com'
  - 'github.com'
DOMAIN_AAAA_RECORDS:
  - 'google.com'
  - 'ipv6.google.com'

# HTTP確認パラメータ
HTTP_IPV4_TARGET: 'https://www.google.com'
HTTP_IPV6_TARGET: 'https://ipv6.google.com'
```

## 実行例

以下は`ens18`インターフェースでLinuxシステムでの実際の実行結果です：

```
=== Network Diagnostics Tool (pingood-go) ===
Platform: linux/amd64
Interface: ens18
Time: 2025-07-12 17:37:23

1. IP Address Check
==================
✅ IPv4: 192.168.11.60
❌ IPv6: Not found

2. Default Gateway Check
========================
✅ Gateway: 192.168.10.1

3. ICMP Ping Test (IPv4)
========================
✅ 8.8.8.8: 0.0% packet loss, RTT min/avg/max = 6.1/6.4/6.7 ms
✅ 1.1.1.1: 0.0% packet loss, RTT min/avg/max = 6.6/6.9/7.1 ms

4. ICMP Ping Test (IPv6)
========================
❌ 2001:4860:4860::8888: Failed - command failed: ping6: exit status 2, stderr: ping6: connect: Network is unreachable

❌ 2606:4700:4700::1111: Failed - command failed: ping6: exit status 2, stderr: ping6: connect: Network is unreachable


5. Traceroute Test
==================
❌ Traceroute failed: command failed: traceroute: exec: "traceroute": executable file not found in $PATH, stderr:

6. DNS Resolution Test (A Records)
==================================
✅ google.com: [142.250.207.14]
✅ github.com: [20.27.177.113]

7. DNS Resolution Test (AAAA Records)
=====================================
✅ google.com: [2404:6800:4004:81f::200e]
✅ ipv6.google.com: [ipv6.l.google.com. 2404:6800:4004:826::200e]

8. HTTP Connectivity Test (IPv4)
=================================
✅ https://www.google.com: Status 200, Time 0.24s

9. HTTP Connectivity Test (IPv6)
=================================
❌ https://ipv6.google.com: Failed - Get "https://ipv6.google.com": dial tcp [2404:6800:4004:826::200e]:443: connect: network is unreachable

=== Diagnostics Complete ===
```

### 結果の分析

この例では、一般的なネットワーク環境でよく見られるシナリオを示しています：

- **✅ IPv4接続性**: 優秀なping時間（6-7ms）で完全なIPv4接続
- **❌ IPv6サポート**: ローカルインターフェースでIPv6設定なし（DNSでIPv6アドレス解決は可能）
- **✅ DNS解決**: AレコードとAAAAレコード両方の解決が正常に動作
- **✅ HTTP接続性**: IPv4 HTTPアクセスが良好な応答時間（0.24秒）で動作
- **❌ ツール不足**: `traceroute`がシステムにインストールされていない（最小インストールでよくある）

### 結果の見方

- **緑 ✅**: テスト成功
- **赤 ❌**: テスト失敗（ネットワーク問題、ツール不足、設定問題の可能性）
- **RTT値**: ラウンドトリップ時間（ミリ秒）（低い方が良い）
- **パケットロス**: 失われたパケットの割合（0%が理想）
- **ステータスコード**: HTTPレスポンスコード（200 = 成功）

## トラブルシューティング

### よくある問題と解決方法

**1. "traceroute: executable file not found"**
```bash
# Ubuntu/Debianでtracerouteをインストール:
sudo apt install traceroute

# CentOS/RHELでtracerouteをインストール:
sudo yum install traceroute
```

**2. "ping: operation not permitted"**
- ICMP pingは管理者権限や特別な権限が必要な場合があります
- `sudo`で実行するか、権限を設定してください：
```bash
sudo setcap cap_net_raw+ep ./bin/pingood
```

**3. "IPv6: Not found"やIPv6接続問題**
- IPv6がネットワークインターフェースで設定されていない可能性があります
- IPv6設定を確認: `ip -6 addr show`
- IPv6設定についてはネットワーク管理者にお問い合わせください

**4. "No such device"インターフェースエラー**
- 利用可能なインターフェースを確認: `ip link show` (Linux) または `ifconfig -l` (macOS)
- 正しいインターフェース名を使用してください（例：`eth0`, `ens18`, `wlan0`, `en0`）

**5. DNS解決の失敗**
- `dig`がインストールされていることを確認: `sudo apt install dnsutils` (Ubuntu/Debian)
- DNS設定を確認: `cat /etc/resolv.conf`

## システム要件

### 依存関係

このツールには以下のシステムユーティリティが必要です：

- `ping` / `ping6` - ICMPテスト用
- `traceroute` - 経路追跡用
- `dig` - DNS問い合わせ用
- `ip` (Linux) または `ifconfig` (macOS) - ネットワークインターフェース情報用

### 権限

一部の操作には管理者権限が必要な場合があります：

- ICMP pingテストは通常、管理者権限や特別な権限が必要
- ネットワークインターフェース問い合わせは適切な権限が必要な場合があります

## 開発

### プロジェクト構成

```
day006_pingood-go/
├── cmd/pingood/           # メインアプリケーションエントリポイント
├── internal/
│   ├── checker/           # ネットワーク確認実装
│   └── config/            # 設定処理
├── test/                  # テストファイル
├── conf.yaml             # デフォルト設定
├── Makefile              # ビルド自動化
└── README.md             # このファイル
```

### ビルド

```bash
# 依存関係のインストール
make deps

# テスト実行
make test

# 現在のプラットフォーム向けビルド
make build

# すべてのサポートプラットフォーム向けビルド
make build-all

# コードフォーマット
make fmt

# リンター実行 (golangci-lintが必要)
make lint
```

### テスト

```bash
# すべてのテスト実行
make test

# レース検出付きテスト実行
make test-race

# カバレッジレポート生成
make coverage
```

## Python版との比較

| 機能 | Python版 | Go版 |
|------|----------|------|
| プラットフォームサポート | Linux, macOS, Windows | Linux, macOS |
| バイナリ配布 | なし | あり |
| パフォーマンス | 良い | 優秀 |
| メモリ使用量 | 高い | 低い |
| 起動時間 | 遅い | 高速 |
| 依存関係 | Python + パッケージ | なし（静的バイナリ） |

## 学んだこと

- **Go言語でのクロスプラットフォーム開発**: 異なるOSに対応したネットワークツールの実装
- **システムコマンドの実行**: `os/exec`パッケージを使った外部コマンドの呼び出しと結果パース
- **インターフェース設計**: プラットフォーム固有の実装を抽象化するインターフェースパターン
- **YAML設定管理**: 構造体タグを使った設定ファイルの自動マッピング
- **ネットワーク診断**: 包括的なネットワーク問題の特定手法
- **エラーハンドリング**: Go言語でのエラーの適切な処理と報告
- **テスト駆動開発**: 各機能に対する単体テストの作成
- **静的バイナリ配布**: 依存関係なしの実行可能ファイル作成の利点

## ライセンス

このプロジェクトはsolo-hackathonリポジトリの一部です。ライセンス情報についてはメインリポジトリを参照してください。