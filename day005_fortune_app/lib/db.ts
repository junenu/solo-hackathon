import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'db', 'dev.db');

const db = new Database(dbPath);

export function initializeSchema() {
  // 運勢レベルテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS fortune_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      color TEXT NOT NULL
    )
  `);

  // 運勢コメントテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS fortune_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fortune_level_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      FOREIGN KEY (fortune_level_id) REFERENCES fortune_levels(id)
    )
  `);

  // ラッキーアイテムテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS lucky_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);

  // 初期データ投入
  insertInitialData();
}

function insertInitialData() {
  // 運勢レベル初期データ
  const fortuneLevels = [
    { name: '大吉', value: 5, color: '#ff6b6b' },
    { name: '中吉', value: 4, color: '#4ecdc4' },
    { name: '小吉', value: 3, color: '#45b7d1' },
    { name: '末吉', value: 2, color: '#96ceb4' },
    { name: '凶', value: 1, color: '#ffeaa7' }
  ];

  const checkFortuneLevel = db.prepare('SELECT COUNT(*) as count FROM fortune_levels');
  const result = checkFortuneLevel.get() as { count: number } | undefined;
  if (result?.count === 0) {
    const insertFortuneLevel = db.prepare('INSERT INTO fortune_levels (name, value, color) VALUES (?, ?, ?)');
    fortuneLevels.forEach(level => {
      insertFortuneLevel.run(level.name, level.value, level.color);
    });
  }

  // 運勢コメント初期データ
  const fortuneComments = [
    { fortune_level_id: 1, comment: '今日は最高の一日になりそうです！新しいことに挑戦してみましょう。' },
    { fortune_level_id: 1, comment: '運気絶好調！積極的に行動することで素晴らしい結果が待っています。' },
    { fortune_level_id: 2, comment: '良い一日になりそうです。人との出会いを大切にしましょう。' },
    { fortune_level_id: 2, comment: '今日は順調な一日。計画していたことを実行に移すのに良い日です。' },
    { fortune_level_id: 3, comment: '穏やかな一日になりそうです。小さな幸せを見つけてください。' },
    { fortune_level_id: 3, comment: '今日は優しい気持ちで過ごしてください。思いやりが幸運を呼びます。' },
    { fortune_level_id: 4, comment: '今日は慎重に行動しましょう。焦らずゆっくりと進めば良い結果が。' },
    { fortune_level_id: 4, comment: '小さな成功を大切に。今日は基礎固めに最適な日です。' },
    { fortune_level_id: 5, comment: '今日は無理をせず、休息を取ることも大切です。明日に向けて準備しましょう。' },
    { fortune_level_id: 5, comment: '慎重に行動し、周りの人に感謝の気持ちを持つことで運気が改善されます。' }
  ];

  const checkComments = db.prepare('SELECT COUNT(*) as count FROM fortune_comments');
  const commentsResult = checkComments.get() as { count: number } | undefined;
  if (commentsResult?.count === 0) {
    const insertComment = db.prepare('INSERT INTO fortune_comments (fortune_level_id, comment) VALUES (?, ?)');
    fortuneComments.forEach(comment => {
      insertComment.run(comment.fortune_level_id, comment.comment);
    });
  }

  // ラッキーアイテム初期データ
  const luckyItems = [
    { name: '赤いペン', category: '文房具' },
    { name: '青いハンカチ', category: '日用品' },
    { name: '小さな鈴', category: 'アクセサリー' },
    { name: '四つ葉のクローバー', category: '植物' },
    { name: '白い花', category: '植物' },
    { name: '金色のコイン', category: '小物' },
    { name: '丸い石', category: '自然' },
    { name: '緑のペンダント', category: 'アクセサリー' },
    { name: '猫の置物', category: '雑貨' },
    { name: '星の形のもの', category: '小物' },
    { name: '黄色い傘', category: '日用品' },
    { name: '本', category: '文房具' },
    { name: '音楽を奏でるもの', category: '娯楽' },
    { name: '鍵', category: '小物' },
    { name: '鏡', category: '日用品' }
  ];

  const checkItems = db.prepare('SELECT COUNT(*) as count FROM lucky_items');
  const itemsResult = checkItems.get() as { count: number } | undefined;
  if (itemsResult?.count === 0) {
    const insertItem = db.prepare('INSERT INTO lucky_items (name, category) VALUES (?, ?)');
    luckyItems.forEach(item => {
      insertItem.run(item.name, item.category);
    });
  }
}

export function getTodaysFortune(date: string): any {
  // 日付をシードとしてランダムな運勢を生成
  const seed = hashString(date);
  
  // 運勢レベルを取得
  const fortuneLevels = db.prepare('SELECT * FROM fortune_levels ORDER BY id').all() as any[];
  const selectedFortune = fortuneLevels[seed % fortuneLevels.length];
  
  // 選択された運勢のコメントを取得
  const comments = db.prepare('SELECT * FROM fortune_comments WHERE fortune_level_id = ?').all(selectedFortune.id) as any[];
  const selectedComment = comments[(seed + 1) % comments.length];
  
  // ラッキーアイテムを取得
  const luckyItems = db.prepare('SELECT * FROM lucky_items ORDER BY id').all() as any[];
  const selectedItem = luckyItems[(seed + 2) % luckyItems.length];
  
  return {
    fortune: selectedFortune,
    comment: selectedComment.comment,
    luckyItem: selectedItem
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  return Math.abs(hash);
}

export default db;