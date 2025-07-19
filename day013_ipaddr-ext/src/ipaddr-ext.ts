export class IPAddrExt {
  private address: string;
  private prefix: number;
  private isIPv6: boolean;
  private addressBytes: bigint;

  constructor(cidr: string) {
    const [addr, prefixStr] = cidr.split('/');
    this.address = addr;
    this.isIPv6 = addr.includes(':');
    
    if (prefixStr) {
      this.prefix = parseInt(prefixStr, 10);
    } else {
      this.prefix = this.isIPv6 ? 128 : 32;
    }

    this.addressBytes = this.parseAddress(addr);
  }

  private parseAddress(addr: string): bigint {
    if (this.isIPv6) {
      return this.parseIPv6(addr);
    } else {
      return this.parseIPv4(addr);
    }
  }

  private parseIPv4(addr: string): bigint {
    const parts = addr.split('.');
    if (parts.length !== 4) {
      throw new Error('Invalid IPv4 address');
    }
    
    let result = 0n;
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        throw new Error('Invalid IPv4 address');
      }
      result = (result << 8n) | BigInt(num);
    }
    return result;
  }

  private parseIPv6(addr: string): bigint {
    // Handle :: expansion
    let expandedAddr = addr;
    if (addr.includes('::')) {
      const parts = addr.split('::');
      const leftParts = parts[0] ? parts[0].split(':') : [];
      const rightParts = parts[1] ? parts[1].split(':') : [];
      const missingParts = 8 - leftParts.length - rightParts.length;
      const middleParts = new Array(missingParts).fill('0');
      expandedAddr = [...leftParts, ...middleParts, ...rightParts].join(':');
    }

    const parts = expandedAddr.split(':');
    if (parts.length !== 8) {
      throw new Error('Invalid IPv6 address');
    }

    let result = 0n;
    for (const part of parts) {
      const num = parseInt(part || '0', 16);
      if (isNaN(num) || num < 0 || num > 0xFFFF) {
        throw new Error('Invalid IPv6 address');
      }
      result = (result << 16n) | BigInt(num);
    }
    return result;
  }

  private formatAddress(bytes: bigint): string {
    if (this.isIPv6) {
      return this.formatIPv6(bytes);
    } else {
      return this.formatIPv4(bytes);
    }
  }

  private formatIPv4(bytes: bigint): string {
    const parts: number[] = [];
    for (let i = 0; i < 4; i++) {
      parts.unshift(Number(bytes & 0xFFn));
      bytes = bytes >> 8n;
    }
    return parts.join('.');
  }

  private formatIPv6(bytes: bigint): string {
    const parts: string[] = [];
    for (let i = 0; i < 8; i++) {
      parts.unshift((Number(bytes & 0xFFFFn)).toString(16));
      bytes = bytes >> 16n;
    }
    
    // Compress consecutive zeros
    let result = parts.join(':');
    
    // Find the longest sequence of consecutive zero groups
    let longestStart = -1;
    let longestLength = 0;
    let currentStart = -1;
    let currentLength = 0;
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '0') {
        if (currentStart === -1) {
          currentStart = i;
          currentLength = 1;
        } else {
          currentLength++;
        }
      } else {
        if (currentLength > longestLength) {
          longestStart = currentStart;
          longestLength = currentLength;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }
    
    if (currentLength > longestLength) {
      longestStart = currentStart;
      longestLength = currentLength;
    }
    
    // Only compress if we have at least 2 consecutive zeros
    if (longestLength >= 2) {
      const before = parts.slice(0, longestStart);
      const after = parts.slice(longestStart + longestLength);
      
      if (before.length === 0 && after.length === 0) {
        result = '::';
      } else if (before.length === 0) {
        result = '::' + after.join(':');
      } else if (after.length === 0) {
        result = before.join(':') + '::';
      } else {
        result = before.join(':') + '::' + after.join(':');
      }
    }
    
    return result;
  }

  toString(): string {
    return this.formatAddress(this.addressBytes);
  }

  toStringWithPrefix(): string {
    return `${this.toString()}/${this.prefix}`;
  }

  add(value: number): IPAddrExt {
    const newAddr = this.addressBytes + BigInt(value);
    const maxValue = this.isIPv6 ? (1n << 128n) - 1n : (1n << 32n) - 1n;
    if (newAddr > maxValue) {
      throw new Error('Address overflow');
    }
    const newAddrStr = this.formatAddress(newAddr);
    return new IPAddrExt(`${newAddrStr}/${this.prefix}`);
  }

  subtract(value: number): IPAddrExt {
    const newAddr = this.addressBytes - BigInt(value);
    if (newAddr < 0n) {
      throw new Error('Address underflow');
    }
    const newAddrStr = this.formatAddress(newAddr);
    return new IPAddrExt(`${newAddrStr}/${this.prefix}`);
  }

  broadcast(): IPAddrExt {
    if (this.isIPv6) {
      throw new Error('Broadcast is not applicable to IPv6');
    }
    const hostBits = 32 - this.prefix;
    const broadcastAddr = this.addressBytes | ((1n << BigInt(hostBits)) - 1n);
    const broadcastStr = this.formatAddress(broadcastAddr);
    return new IPAddrExt(`${broadcastStr}/${this.prefix}`);
  }

  wildcardMask(): string {
    if (this.isIPv6) {
      throw new Error('Wildcard mask is not applicable to IPv6');
    }
    const hostBits = 32 - this.prefix;
    const mask = (1n << BigInt(hostBits)) - 1n;
    return this.formatIPv4(mask);
  }

  toHost(): IPAddrExt {
    const hostBits = this.isIPv6 ? 128 - this.prefix : 32 - this.prefix;
    const networkMask = ((1n << BigInt(this.isIPv6 ? 128 : 32)) - 1n) ^ ((1n << BigInt(hostBits)) - 1n);
    const networkAddr = this.addressBytes & networkMask;
    const networkStr = this.formatAddress(networkAddr);
    return new IPAddrExt(`${networkStr}/128`);
  }

  succ(): IPAddrExt {
    return this.add(1);
  }

  toJSON(): string {
    return JSON.stringify(this.toStringWithPrefix());
  }

  equals(other: IPAddrExt): boolean {
    return this.addressBytes === other.addressBytes && 
           this.prefix === other.prefix &&
           this.isIPv6 === other.isIPv6;
  }

  static fromString(str: string): IPAddrExt {
    return new IPAddrExt(str);
  }
}