import * as net from 'net';

export interface ScanResult {
  port: number;
  isOpen: boolean;
  service?: string;
  error?: string;
}

export class PortScanner {
  private timeout: number;

  constructor(timeout: number = 1000) {
    this.timeout = timeout;
  }

  async scanPort(host: string, port: number): Promise<ScanResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isConnected = false;

      socket.setTimeout(this.timeout);

      socket.on('connect', () => {
        isConnected = true;
        socket.destroy();
        resolve({
          port,
          isOpen: true,
          service: this.getServiceName(port)
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          port,
          isOpen: false,
          error: 'timeout'
        });
      });

      socket.on('error', (err) => {
        if (!isConnected) {
          resolve({
            port,
            isOpen: false,
            error: err.message
          });
        }
      });

      socket.connect(port, host);
    });
  }

  async scanPorts(host: string, ports: number[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    
    for (const port of ports) {
      const result = await this.scanPort(host, port);
      results.push(result);
    }

    return results;
  }

  async scanRange(host: string, startPort: number, endPort: number, concurrency: number = 50): Promise<ScanResult[]> {
    const ports: number[] = [];
    for (let port = startPort; port <= endPort; port++) {
      ports.push(port);
    }

    const results: ScanResult[] = [];
    const chunks: number[][] = [];

    for (let i = 0; i < ports.length; i += concurrency) {
      chunks.push(ports.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(port => this.scanPort(host, port))
      );
      results.push(...chunkResults);
    }

    return results.sort((a, b) => a.port - b.port);
  }

  private getServiceName(port: number): string | undefined {
    const commonPorts: Record<number, string> = {
      20: 'FTP-DATA',
      21: 'FTP',
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      445: 'SMB',
      3306: 'MySQL',
      5432: 'PostgreSQL',
      3389: 'RDP',
      8080: 'HTTP-Proxy',
      8443: 'HTTPS-Alt',
      27017: 'MongoDB',
      6379: 'Redis',
      5000: 'Flask',
      3000: 'Node.js',
      8000: 'Django',
      9000: 'PHP-FPM',
      11211: 'Memcached'
    };

    return commonPorts[port];
  }
}