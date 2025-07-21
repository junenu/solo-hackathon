# crun - Cisco Run

## 概要（What）

`crun`は、Cisco機器にSSH/Telnet経由でログインし、コマンドを実行して出力を取得するCLIツールです。

主な特徴:
- **クリーンな出力**: AIや自動化ツールで使いやすいよう、余計なログを排除
- **シンプルなインターフェース**: 必要最小限のオプションで簡単に使用可能
- **設定ファイルサポート**: ホストごとの認証情報を事前設定可能

## セットアップ方法（How to install）

```bash
# ビルド
go build -o crun

# インストール（オプション）
go install
```

## 使い方（How to use）

### 基本的な使用方法

```bash
# 単一ホスト、単一コマンドの実行
crun -host router1 -u admin -pass secret -c "show version"

# 複数コマンドの実行（セミコロン区切り）
crun -host router1 -u admin -pass secret -c "show version;show interfaces"

# 複数ホストでの実行（カンマ区切り）
crun -host "router1,router2,router3" -u admin -pass secret -c "show version"

# SSH鍵認証を使用
crun -host router1 -u admin -key ~/.ssh/id_rsa -c "show version"

# パスフレーズ付きSSH鍵を使用
crun -host router1 -u admin -key ~/.ssh/id_rsa -passphrase mypassphrase -c "show version"

# Enableモードが必要な場合
crun -host router1 -u admin -pass secret -e enablepass -c "show running-config"
```

### 設定ファイルの使用

`~/.crunrc`ファイルに認証情報を保存できます:

```
# .crunrc example
add user router* admin
add password router* secret123
add enable router* enablepass123
add method router* ssh
add port router* 22
```

設定ファイルを使用した実行:

```bash
# デフォルトの設定ファイル（~/.crunrc）を使用
crun -host router1 -c "show version"

# カスタム設定ファイルを指定
crun -f /path/to/config -host router1 -c "show version"
```

### オプション一覧

- `-host`, `-h`: 接続先ホスト（必須、複数の場合はカンマ区切り）
- `-port`, `-p`: ポート番号（デフォルト: 22）
- `-user`, `-u`: ユーザー名
- `-pass`: パスワード
- `-enable`, `-e`: Enableパスワード
- `-command`, `-c`: 実行するコマンド（セミコロン区切りで複数指定可）
- `-method`, `-m`: 接続方法（ssh/telnet、デフォルト: ssh）
- `-timeout`, `-t`: タイムアウト秒数（デフォルト: 30）
- `-config`, `-f`: 設定ファイルパス
- `-debug`, `-d`: デバッグ出力を有効化
- `-json`, `-j`: JSON形式で出力
- `-parallel`, `-P`: 複数ホストの並列実行（デフォルト: true）
- `-key`, `-i`: SSH秘密鍵ファイルのパス
- `-passphrase`: SSH鍵のパスフレーズ

### 環境変数

- `CRUN_USER`: デフォルトのユーザー名
- `CRUNRC`: デフォルトの設定ファイルパス

## 改善予定

### 現在の実装済み機能
- SSH接続によるコマンド実行
- クリーンな出力（コマンドエコーとプロンプトを除去）
- 設定ファイルサポート
- Enableモードのサポート
- ページネーション無効化（terminal length 0）
- JSON形式での出力
- 複数ホスト対応（並列・逐次実行選択可能）
- SSH鍵認証（RSA、Ed25519、ECDSA、DSA対応）
- パスフレーズ付きSSH鍵のサポート
- デフォルトSSH鍵の自動検索（~/.ssh/id_*）

### 今後の改善点
1. **Telnet対応**: 現在はSSHのみ対応。Telnetフォールバックの実装
2. **プロンプト検出の改善**: より多様なデバイスのプロンプトパターンに対応
3. **エラーハンドリングの強化**: 接続エラー時の詳細なメッセージ
4. **インタラクティブモード**: `-c`オプションなしでインタラクティブセッション
5. **ログファイル出力**: デバッグ用のログファイル出力機能
6. **ホスト範囲指定**: IPアドレス範囲やホスト名パターンでの一括指定
7. **出力フォーマット**: JSON/CSV等の構造化出力オプション
8. **SSH Agent対応**: SSH Agentを使った鍵管理のサポート

## 既知の問題点と解決策

### cloginとの違い
- **出力のクリーンさ**: crunは余計な接続ログを出力しない
- **シンプルな設定**: 必要最小限の設定項目に絞っている
- **AI向け最適化**: 出力がそのまま解析可能

### 使用例（AI連携）

```bash
# AIツールでの使用例
output=$(crun -host router1 -c "show interfaces")
echo "$output" | your-ai-analyzer

# JSON形式での出力（構造化データとして処理しやすい）
crun -host router1 -c "show clock;show version;show ip interface brief" -json

# 複数ホストでの並列実行
crun -host "router1,router2,router3" -c "show version" -json

# パイプラインでの使用
crun -host router1 -c "show running-config" | grep interface

# SSH鍵認証でJSON出力
crun -host 192.168.64.23 -u admin -c "show clock" -json -i ~/.ssh/id_ed25519

# JSON出力をjqで処理（単一ホスト）
crun -host router1 -c "show interfaces" -json | jq '.hosts[0].results[0].output'

# 複数ホストの結果を処理
crun -host "router1,router2" -c "show version" -json | jq '.hosts[] | {host: .host, success: .success}'
```

### JSON出力形式

JSON出力では以下の形式でデータが返されます：

```json
{
  "hosts": [
    {
      "host": "192.168.64.23",
      "results": [
        {
          "command": "show clock",
          "output": "*05:50:07.782 UTC Mon Jul 21 2025",
          "timestamp": "2025-07-21T14:50:05+09:00"
        }
      ],
      "success": true,
      "duration": "475.709583ms"
    }
  ],
  "total_hosts": 1,
  "successful": 1,
  "failed": 0,
  "duration": "476.999916ms",
  "parallel": true
}
```

### 認証方式の優先順位

`crun`は以下の順序で認証を試行します：

1. **SSH鍵認証**（`-key`で指定された鍵）
2. **パスワード認証**（`-pass`で指定されたパスワード）
3. **デフォルトSSH鍵**（`~/.ssh/id_*`の自動検索）

複数の認証方式が利用可能な場合、SSH鍵認証が優先されます。