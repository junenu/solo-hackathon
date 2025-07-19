# IPAddrExt for TypeScript

IPAddrExt provides extensions for IP address manipulation in TypeScript, inspired by the Ruby ipaddr-ext gem.

## Overview

This library provides a TypeScript implementation of IP address manipulation with the following features:

- IPv4 and IPv6 address parsing and formatting
- CIDR notation support
- Arithmetic operations (add/subtract)
- Broadcast address calculation (IPv4)
- Wildcard mask calculation (IPv4)
- Network/host address conversion
- JSON serialization with prefix

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { IPAddrExt } from './src/ipaddr-ext';

// IPv6 Examples
// to_s_with_prefix
const ipaddr1 = new IPAddrExt("3ffe:505:2::1");
console.log(ipaddr1.toStringWithPrefix());
// => "3ffe:505:2::1/128"

const ipaddr2 = new IPAddrExt("3ffe:505:2::/64");
console.log(ipaddr2.toStringWithPrefix());
// => "3ffe:505:2::/64"

// +/- operations
const ipaddr3 = new IPAddrExt("3ffe:505:2::1");
console.log(ipaddr3.add(5).toStringWithPrefix());
// => "3ffe:505:2::6/128"

const ipaddr4 = new IPAddrExt("3ffe:505:2::9");
console.log(ipaddr4.subtract(5).toStringWithPrefix());
// => "3ffe:505:2::4/128"

// to_host
const ipaddr5 = new IPAddrExt("3ffe:505:2::/64");
console.log(ipaddr5.toHost().toStringWithPrefix());
// => "3ffe:505:2::/128"
console.log(ipaddr5.toHost().succ().toStringWithPrefix());
// => "3ffe:505:2::1/128"

// IPv4 Examples
// broadcast / wildcard_mask
const ipaddr6 = new IPAddrExt("192.0.2.0/24");
console.log(ipaddr6.broadcast().toString());
// => "192.0.2.255"
console.log(ipaddr6.wildcardMask());
// => "0.0.0.255"

// JSON export with prefix
console.log(new IPAddrExt("3ffe:505:2::/64").toJSON());
// => "\"3ffe:505:2::/64\""

// Equality comparison with prefix
console.log(new IPAddrExt("192.168.1.0/24").equals(new IPAddrExt("192.168.1.0/24")));
// => true
console.log(new IPAddrExt("192.168.1.0/24").equals(new IPAddrExt("192.168.1.0/25")));
// => false
```

## Testing

```bash
npm test
```

## Methods

- `toStringWithPrefix()`: Returns the IP address with CIDR prefix
- `add(value: number)`: Add a number to the IP address
- `subtract(value: number)`: Subtract a number from the IP address
- `broadcast()`: Get broadcast address (IPv4 only)
- `wildcardMask()`: Get wildcard mask (IPv4 only)
- `toHost()`: Convert to host address (/128 for IPv6, /32 for IPv4)
- `succ()`: Get successor IP address (equivalent to add(1))
- `toJSON()`: Export as JSON string with prefix
- `equals(other: IPAddrExt)`: Compare with another IPAddrExt including prefix

## Error Handling

The library throws errors for:
- Invalid IP addresses
- Address overflow/underflow during arithmetic operations
- Calling IPv4-only methods (broadcast, wildcardMask) on IPv6 addresses