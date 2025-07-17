import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

declare global {
  interface Window {
    electronAPI: {
      ping: (host: string) => Promise<any>;
      checkPort: (host: string, port: number) => Promise<any>;
      traceroute: (host: string) => Promise<any>;
    }
  }
}

type CheckType = 'ping' | 'port' | 'traceroute';

interface Result {
  type: CheckType;
  host: string;
  port?: number;
  timestamp: Date;
  data: any;
}

function App() {
  const [checkType, setCheckType] = useState<CheckType>('ping');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const handleCheck = async () => {
    if (!host.trim()) {
      alert('ホスト名またはIPアドレスを入力してください');
      return;
    }

    if (checkType === 'port' && !port.trim()) {
      alert('ポート番号を入力してください');
      return;
    }

    setLoading(true);
    try {
      let data;
      switch (checkType) {
        case 'ping':
          data = await window.electronAPI.ping(host);
          break;
        case 'port':
          data = await window.electronAPI.checkPort(host, parseInt(port));
          break;
        case 'traceroute':
          data = await window.electronAPI.traceroute(host);
          break;
      }

      const newResult: Result = {
        type: checkType,
        host,
        port: checkType === 'port' ? parseInt(port) : undefined,
        timestamp: new Date(),
        data
      };

      setResults([newResult, ...results]);
    } catch (error) {
      console.error('Error:', error);
      alert('チェック中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    const data = results.map(r => ({
      type: r.type,
      host: r.host,
      port: r.port,
      timestamp: r.timestamp.toISOString(),
      success: r.data.success,
      output: r.data.output || r.data.message || r.data.error
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-check-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Network Checker</h1>
        <p>ネットワーク疎通チェックツール</p>
      </header>

      <div className="controls">
        <div className="check-type">
          <label>
            <input
              type="radio"
              value="ping"
              checked={checkType === 'ping'}
              onChange={(e) => setCheckType(e.target.value as CheckType)}
            />
            Ping
          </label>
          <label>
            <input
              type="radio"
              value="port"
              checked={checkType === 'port'}
              onChange={(e) => setCheckType(e.target.value as CheckType)}
            />
            Port Check
          </label>
          <label>
            <input
              type="radio"
              value="traceroute"
              checked={checkType === 'traceroute'}
              onChange={(e) => setCheckType(e.target.value as CheckType)}
            />
            Traceroute
          </label>
        </div>

        <div className="inputs">
          <input
            type="text"
            placeholder="ホスト名またはIPアドレス (例: google.com, 192.168.1.1)"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
          />
          {checkType === 'port' && (
            <input
              type="number"
              placeholder="ポート番号 (例: 80, 443)"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
            />
          )}
        </div>

        <div className="buttons">
          <button 
            onClick={handleCheck} 
            disabled={loading}
            className="check-btn"
          >
            {loading ? 'チェック中...' : 'チェック実行'}
          </button>
          {results.length > 0 && (
            <>
              <button onClick={exportResults} className="export-btn">
                結果をエクスポート
              </button>
              <button onClick={clearResults} className="clear-btn">
                クリア
              </button>
            </>
          )}
        </div>
      </div>

      <div className="results">
        {results.map((result, index) => (
          <div key={index} className={`result ${result.data.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <h3>
                {result.type.toUpperCase()} - {result.host}
                {result.port && `:${result.port}`}
              </h3>
              <span className="timestamp">
                {result.timestamp.toLocaleString('ja-JP')}
              </span>
            </div>
            
            {result.type === 'ping' && result.data.stats && (
              <div className="stats">
                <div>送信: {result.data.stats.sent}</div>
                <div>受信: {result.data.stats.received}</div>
                <div>損失: {result.data.stats.lossPercent.toFixed(1)}%</div>
                {result.data.stats.avg && (
                  <div>平均応答時間: {result.data.stats.avg.toFixed(1)}ms</div>
                )}
              </div>
            )}
            
            {result.type === 'port' && (
              <div className="message">
                {result.data.message}
              </div>
            )}
            
            <pre className="output">
              {result.data.output || result.data.error}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);