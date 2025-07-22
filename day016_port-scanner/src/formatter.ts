import { ScanResult } from './scanner';
import chalk from 'chalk';

export class ResultFormatter {
  static formatTable(results: ScanResult[], host: string): string {
    const openPorts = results.filter(r => r.isOpen);
    const closedPorts = results.filter(r => !r.isOpen);

    let output = '';
    output += chalk.bold.cyan(`\nScan Results for ${host}\n`);
    output += chalk.gray('='.repeat(50)) + '\n\n';

    if (openPorts.length > 0) {
      output += chalk.green.bold(`Open Ports (${openPorts.length}):\n`);
      output += chalk.gray('-'.repeat(40)) + '\n';
      
      const maxPortWidth = Math.max(...openPorts.map(p => p.port.toString().length), 4);
      const maxServiceWidth = Math.max(...openPorts.map(p => (p.service || 'Unknown').length), 7);

      output += chalk.bold(`${'PORT'.padEnd(maxPortWidth + 2)}${'SERVICE'.padEnd(maxServiceWidth + 2)}STATUS\n`);
      
      openPorts.forEach(port => {
        const portStr = port.port.toString().padEnd(maxPortWidth + 2);
        const serviceStr = (port.service || 'Unknown').padEnd(maxServiceWidth + 2);
        output += `${chalk.yellow(portStr)}${chalk.blue(serviceStr)}${chalk.green('OPEN')}\n`;
      });
    } else {
      output += chalk.red('No open ports found.\n');
    }

    output += '\n' + chalk.gray(`Scanned ${results.length} ports. ${openPorts.length} open, ${closedPorts.length} closed.\n`);

    return output;
  }

  static formatJSON(results: ScanResult[], host: string): string {
    const data = {
      host,
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        open: results.filter(r => r.isOpen).length,
        closed: results.filter(r => !r.isOpen).length
      },
      results: results.filter(r => r.isOpen).map(r => ({
        port: r.port,
        service: r.service || 'Unknown',
        status: 'open'
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  static formatCSV(results: ScanResult[], host: string): string {
    let csv = 'Host,Port,Service,Status\n';
    
    results.forEach(result => {
      const service = result.service || 'Unknown';
      const status = result.isOpen ? 'open' : 'closed';
      csv += `${host},${result.port},"${service}",${status}\n`;
    });

    return csv;
  }

  static formatSimple(results: ScanResult[]): string {
    const openPorts = results
      .filter(r => r.isOpen)
      .map(r => r.port)
      .join(',');

    return openPorts || 'No open ports found';
  }
}