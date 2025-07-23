# Task Tracker API

RESTful タスク管理APIです。SQLiteを使ってタスクの作成、読み取り、更新、削除（CRUD）操作を提供します。

## 概要

- タスクの CRUD 操作
- カテゴリ別管理
- 優先度設定（low/medium/high）
- ステータス管理（todo/in_progress/done）
- 期限設定
- 検索・フィルタリング機能

## セットアップ方法

```bash
# 依存関係のインストール
npm install

# データベースの初期化
npm run migrate

# 開発サーバーの起動
npm run dev
```

## 使い方

### エンドポイント

#### ヘルスチェック
```bash
GET http://localhost:3000/health
```

#### タスク一覧の取得
```bash
GET http://localhost:3000/api/tasks

# フィルタリング例
GET http://localhost:3000/api/tasks?status=todo
GET http://localhost:3000/api/tasks?priority=high
GET http://localhost:3000/api/tasks?category=work
GET http://localhost:3000/api/tasks?search=meeting
```

#### タスクの作成
```bash
POST http://localhost:3000/api/tasks
Content-Type: application/json

{
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "category": "work",
  "priority": "high",
  "status": "todo",
  "due_date": "2024-12-31"
}
```

#### タスクの取得
```bash
GET http://localhost:3000/api/tasks/:id
```

#### タスクの更新
```bash
PUT http://localhost:3000/api/tasks/:id
Content-Type: application/json

{
  "title": "更新されたタスク",
  "status": "in_progress"
}
```

#### タスクの削除
```bash
DELETE http://localhost:3000/api/tasks/:id
```

### curlコマンドの例

```bash
# タスクの作成
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"買い物リスト作成","priority":"medium","category":"personal"}'

# タスク一覧の取得
curl http://localhost:3000/api/tasks

# タスクの更新
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"買い物リスト作成","status":"done"}'
```

## データベーススキーマ

```sql
tasks:
  - id (INTEGER PRIMARY KEY)
  - title (TEXT NOT NULL)
  - description (TEXT)
  - category (TEXT)
  - priority (TEXT: low/medium/high)
  - status (TEXT: todo/in_progress/done)
  - due_date (TEXT)
  - created_at (TEXT)
  - updated_at (TEXT)
```