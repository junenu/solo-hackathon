# Day 001: AI Chatbot

## 概要

OpenAI GPT-4.1を使用したシンプルなAIチャットボットの実装

## 実装内容

- OpenAI APIを使用したテキスト生成
- JavaScriptの専門家として振る舞うプロンプト設計
- Node.js + TypeScriptでの実装

## ファイル構成

```text
day001_ai-chatbot/
├── main.ts        # メインアプリケーション
└── README.md      # このファイル
```

## 実行方法

```bash
# 必要な環境変数を設定
export OPENAI_API_KEY="your-api-key-here"

# TypeScriptファイルを直接実行
node main.ts
```

## 主な機能

- OpenAI API経由でGPT-4.1モデルを使用
- 「JavaScriptにおいてセミコロンは省略可能ですか？」という質問に対して専門的な回答を生成
- 日本語での応答

## 使用技術

- Node.js (Type Stripping機能使用)
- TypeScript
- OpenAI API
- ES Modules

## 学習内容

- OpenAI API の基本的な使用方法
- Node.js でのTypeScript直接実行
- ES Modulesの設定（package.jsonでの`"type": "module"`指定）

## 次のステップ

- 対話的なチャットボットへの拡張
- 複数のトピックに対応
- Web UI の追加
