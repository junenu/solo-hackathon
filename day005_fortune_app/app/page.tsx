'use client';

import { useState, useEffect } from 'react';

interface Fortune {
  id: number;
  name: string;
  value: number;
  color: string;
}

interface LuckyItem {
  id: number;
  name: string;
  category: string;
}

interface FortuneData {
  fortune: Fortune;
  comment: string;
  luckyItem: LuckyItem;
}

export default function Home() {
  const [fortuneData, setFortuneData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    fetchFortune(today);
  }, []);

  const fetchFortune = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/fortune?date=${date}`);
      const result = await response.json();
      
      if (result.success) {
        setFortuneData(result.data);
      } else {
        setError(result.error || 'Failed to fetch fortune');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const refreshFortune = () => {
    fetchFortune(currentDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">占い中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">エラーが発生しました</div>
          <div className="text-lg mb-4">{error}</div>
          <button 
            onClick={refreshFortune}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!fortuneData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Day5 - 今日の運勢占い</h1>
          <p className="text-white text-lg">{formatDate(currentDate)}</p>
        </header>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div 
              className="inline-block text-6xl font-bold px-8 py-4 rounded-2xl text-white mb-4"
              style={{ backgroundColor: fortuneData.fortune.color }}
            >
              {fortuneData.fortune.name}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">今日のメッセージ</h3>
            <p className="text-lg text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {fortuneData.comment}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">ラッキーアイテム</h3>
            <div className="flex items-center justify-center">
              <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-800 mb-1">
                  {fortuneData.luckyItem.name}
                </div>
                <div className="text-sm text-yellow-600">
                  {fortuneData.luckyItem.category}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={refreshFortune}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              占い直し
            </button>
          </div>
        </div>

        <footer className="text-center text-white text-sm">
          <p>毎日新しい運勢をお届けします ✨</p>
        </footer>
      </div>
    </div>
  );
}