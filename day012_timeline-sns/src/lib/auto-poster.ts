const samplePosts = [
  'おはようございます！今日も一日頑張りましょう💪',
  'ランチなに食べようかな〜🍜',
  'コーヒー飲みながら作業中☕',
  '今日は天気がいいですね☀️',
  '新しいプロジェクト始めました！',
  'TypeScriptって便利だなぁ',
  'Next.js最高！',
  'お腹すいた...',
  '眠い...でも頑張る！',
  '今日も一日お疲れさまでした🌙',
  'プログラミング楽しい！',
  'バグと格闘中...',
  'やっとデプロイできた！',
  'コードレビューお願いします🙏',
  'テスト書かなきゃ...',
  'リファクタリング完了！',
  'パフォーマンス改善中⚡',
  'ドキュメント更新しました📝',
  'ミーティング終わった〜',
  '集中できる音楽探してます🎵'
];

export function getRandomPost(): string {
  return samplePosts[Math.floor(Math.random() * samplePosts.length)];
}

export function getRandomUserId(userIds: string[]): string {
  return userIds[Math.floor(Math.random() * userIds.length)];
}