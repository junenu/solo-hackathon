import { IPAddrExt } from './ipaddr-ext';

describe('IPAddrExt', () => {
  describe('IPv6', () => {
    test('toStringWithPrefix', () => {
      const ipaddr1 = new IPAddrExt('3ffe:505:2::1');
      expect(ipaddr1.toStringWithPrefix()).toBe('3ffe:505:2::1/128');

      const ipaddr2 = new IPAddrExt('3ffe:505:2::/64');
      expect(ipaddr2.toStringWithPrefix()).toBe('3ffe:505:2::/64');
    });

    test('add operation', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::1');
      const result = ipaddr.add(5);
      expect(result.toStringWithPrefix()).toBe('3ffe:505:2::6/128');
    });

    test('subtract operation', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::9');
      const result = ipaddr.subtract(5);
      expect(result.toStringWithPrefix()).toBe('3ffe:505:2::4/128');
    });

    test('toHost', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::/64');
      const result = ipaddr.toHost();
      expect(result.toStringWithPrefix()).toBe('3ffe:505:2::/128');
      
      const next = result.succ();
      expect(next.toStringWithPrefix()).toBe('3ffe:505:2::1/128');
    });

    test('toJSON', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::/64');
      expect(ipaddr.toJSON()).toBe('"3ffe:505:2::/64"');
    });

    test('equals', () => {
      const ipaddr1 = new IPAddrExt('3ffe:505:2::/64');
      const ipaddr2 = new IPAddrExt('3ffe:505:2::/64');
      const ipaddr3 = new IPAddrExt('3ffe:505:2::/128');
      
      expect(ipaddr1.equals(ipaddr2)).toBe(true);
      expect(ipaddr1.equals(ipaddr3)).toBe(false);
    });
  });

  describe('IPv4', () => {
    test('toStringWithPrefix', () => {
      const ipaddr1 = new IPAddrExt('192.0.2.1');
      expect(ipaddr1.toStringWithPrefix()).toBe('192.0.2.1/32');

      const ipaddr2 = new IPAddrExt('192.0.2.0/24');
      expect(ipaddr2.toStringWithPrefix()).toBe('192.0.2.0/24');
    });

    test('add operation', () => {
      const ipaddr = new IPAddrExt('192.0.2.1');
      const result = ipaddr.add(5);
      expect(result.toStringWithPrefix()).toBe('192.0.2.6/32');
    });

    test('subtract operation', () => {
      const ipaddr = new IPAddrExt('192.0.2.9');
      const result = ipaddr.subtract(5);
      expect(result.toStringWithPrefix()).toBe('192.0.2.4/32');
    });

    test('broadcast', () => {
      const ipaddr = new IPAddrExt('192.0.2.0/24');
      const broadcast = ipaddr.broadcast();
      expect(broadcast.toString()).toBe('192.0.2.255');
    });

    test('wildcardMask', () => {
      const ipaddr = new IPAddrExt('192.0.2.0/24');
      expect(ipaddr.wildcardMask()).toBe('0.0.0.255');
    });

    test('equals', () => {
      const ipaddr1 = new IPAddrExt('192.168.1.0/24');
      const ipaddr2 = new IPAddrExt('192.168.1.0/24');
      const ipaddr3 = new IPAddrExt('192.168.1.0/25');
      
      expect(ipaddr1.equals(ipaddr2)).toBe(true);
      expect(ipaddr1.equals(ipaddr3)).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('invalid IPv4 address', () => {
      expect(() => new IPAddrExt('192.168.1.256')).toThrow('Invalid IPv4 address');
      expect(() => new IPAddrExt('192.168.1')).toThrow('Invalid IPv4 address');
    });

    test('invalid IPv6 address', () => {
      expect(() => new IPAddrExt('gggg::1')).toThrow('Invalid IPv6 address');
    });

    test('address overflow', () => {
      const ipaddr = new IPAddrExt('255.255.255.255');
      expect(() => ipaddr.add(1)).toThrow('Address overflow');
    });

    test('address underflow', () => {
      const ipaddr = new IPAddrExt('0.0.0.0');
      expect(() => ipaddr.subtract(1)).toThrow('Address underflow');
    });

    test('broadcast on IPv6', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::/64');
      expect(() => ipaddr.broadcast()).toThrow('Broadcast is not applicable to IPv6');
    });

    test('wildcard mask on IPv6', () => {
      const ipaddr = new IPAddrExt('3ffe:505:2::/64');
      expect(() => ipaddr.wildcardMask()).toThrow('Wildcard mask is not applicable to IPv6');
    });
  });
});