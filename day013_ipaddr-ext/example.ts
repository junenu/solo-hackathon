import { IPAddrExt } from './src/ipaddr-ext';

console.log('=== IPv6 Examples ===');

// to_s_with_prefix
const ipaddr1 = new IPAddrExt("3ffe:505:2::1");
console.log('ipaddr1.toStringWithPrefix():', ipaddr1.toStringWithPrefix());

const ipaddr2 = new IPAddrExt("3ffe:505:2::/64");
console.log('ipaddr2.toStringWithPrefix():', ipaddr2.toStringWithPrefix());

// +/- operations
const ipaddr3 = new IPAddrExt("3ffe:505:2::1");
console.log('(ipaddr3 + 5).toStringWithPrefix():', ipaddr3.add(5).toStringWithPrefix());

const ipaddr4 = new IPAddrExt("3ffe:505:2::9");
console.log('(ipaddr4 - 5).toStringWithPrefix():', ipaddr4.subtract(5).toStringWithPrefix());

// to_host
const ipaddr5 = new IPAddrExt("3ffe:505:2::/64");
console.log('ipaddr5.toHost().toStringWithPrefix():', ipaddr5.toHost().toStringWithPrefix());
console.log('ipaddr5.toHost().succ().toStringWithPrefix():', ipaddr5.toHost().succ().toStringWithPrefix());

// to_json
console.log('IPAddr.new("3ffe:505:2::/64").toJSON():', new IPAddrExt("3ffe:505:2::/64").toJSON());

console.log('\n=== IPv4 Examples ===');

// broadcast / wildcard_mask
const ipaddr6 = new IPAddrExt("192.0.2.0/24");
console.log('ipaddr6.broadcast():', ipaddr6.broadcast().toString());
console.log('ipaddr6.wildcardMask():', ipaddr6.wildcardMask());

// == comparison
console.log('\n=== Equality Comparison ===');
console.log('IPAddr.new("192.168.1.0/24") == IPAddr.new("192.168.1.0/24"):', 
  new IPAddrExt("192.168.1.0/24").equals(new IPAddrExt("192.168.1.0/24")));
console.log('IPAddr.new("192.168.1.0/24") == IPAddr.new("192.168.1.0/25"):', 
  new IPAddrExt("192.168.1.0/24").equals(new IPAddrExt("192.168.1.0/25")));