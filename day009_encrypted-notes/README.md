# Encrypted Notes

暗号化されたメモを管理するセキュアなCLIツール

## 概要（What）

AES-256暗号化を使用してメモを安全に保存・管理するコマンドラインツールです。すべてのメモはパスワードで暗号化され、ホームディレクトリの `.encrypted_notes.json` ファイルに保存されます。

## セットアップ方法（How to install）

```bash
# ソースからビルド
go build -o encrypted-notes

# 実行可能にする
chmod +x encrypted-notes

# パスの通った場所に移動（オプション）
sudo mv encrypted-notes /usr/local/bin/
```

## 使い方（How to use）

### メモの追加
```bash
./encrypted-notes -add
# パスワードを入力
# タイトルとコンテンツを入力
```

### メモ一覧の表示
```bash
./encrypted-notes -list
# パスワードを入力
```

### 特定のメモを読む
```bash
./encrypted-notes -read <ID>
# パスワードを入力
```

### メモの更新
```bash
./encrypted-notes -update <ID>
# パスワードを入力
# 新しいタイトルとコンテンツを入力
```

### メモの削除
```bash
./encrypted-notes -delete <ID>
# パスワードを入力
```

## 機能

- **AES-256暗号化**: すべてのメモは強力な暗号化で保護されます
- **パスワード保護**: メモへのアクセスにはパスワードが必要です
- **シンプルなCLI**: 使いやすいコマンドラインインターフェース
- **タイムスタンプ**: 作成日時と更新日時を自動記録

## セキュリティ

- パスワードはSHA-256でハッシュ化されてAESキーとして使用されます
- 各暗号化には異なるIV（初期化ベクトル）が使用されます
- 暗号化されたデータはBase64エンコードで保存されます

## 実行ログ

```bash
day009_encrypted-notes (main)% ./encrypted-notes                                                                         kuon 10:03PM
Encrypted Notes - A secure note-taking CLI

Usage:
  -add          Add a new note
  -list         List all notes
  -read <id>    Read a note by ID
  -update <id>  Update a note by ID
  -delete <id>  Delete a note by ID
day009_encrypted-notes (main)% ./encrypted-notes -add                                                                    kuon 10:03PM
Enter password:
Enter title: test
Enter content (press Ctrl+D when done):

Note saved with ID: 1752584657
day009_encrypted-notes (main)% ./encrypted-notes -list                                                                   kuon 10:04PM
Enter password:

Your Notes:
--------------------------------------------------
ID: 1752584657
Title: test
Created: 2025-07-15 22:04
Updated: 2025-07-15 22:04
--------------------------------------------------
```

## 改善予定

- パスワード強度チェック機能
- メモの検索機能
- カテゴリー/タグ機能
- エクスポート/インポート機能
- マルチユーザー対応