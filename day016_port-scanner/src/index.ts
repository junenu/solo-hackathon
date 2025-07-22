#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs';
import { PortScanner } from './scanner';
import { ResultFormatter } from './formatter';

const program = new Command();

program
  .name('port-scanner')
  .description('A fast TCP port scanner')
  .version('1.0.0')
  .argument('<host>', 'Target host to scan')
  .option('-p, --ports <ports>', 'Specific ports to scan (comma-separated)', '')
  .option('-r, --range <start-end>', 'Port range to scan (e.g., 1-1000)', '1-1000')
  .option('-t, --timeout <ms>', 'Connection timeout in milliseconds', '1000')
  .option('-c, --concurrency <n>', 'Number of concurrent connections', '50')
  .option('-f, --format <format>', 'Output format (table, json, csv, simple)', 'table')
  .option('-o, --output <file>', 'Output to file')
  .option('--common', 'Scan only common ports', false)
  .action(async (host, options) => {
    const spinner = ora('Initializing scanner...').start();

    try {
      const scanner = new PortScanner(parseInt(options.timeout));
      let results;

      if (options.common) {
        spinner.text = 'Scanning common ports...';
        const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];
        results = await scanner.scanPorts(host, commonPorts);
      } else if (options.ports) {
        spinner.text = 'Scanning specified ports...';
        const ports = options.ports.split(',').map((p: string) => parseInt(p.trim()));
        results = await scanner.scanPorts(host, ports);
      } else {
        const [start, end] = options.range.split('-').map((p: string) => parseInt(p));
        spinner.text = `Scanning ports ${start}-${end}...`;
        results = await scanner.scanRange(host, start, end, parseInt(options.concurrency));
      }

      spinner.succeed('Scan complete!');

      let output: string;
      switch (options.format) {
        case 'json':
          output = ResultFormatter.formatJSON(results, host);
          break;
        case 'csv':
          output = ResultFormatter.formatCSV(results, host);
          break;
        case 'simple':
          output = ResultFormatter.formatSimple(results);
          break;
        default:
          output = ResultFormatter.formatTable(results, host);
      }

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`✓ Results saved to ${options.output}`));
      } else {
        console.log(output);
      }

    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();