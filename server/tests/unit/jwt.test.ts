import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/common/utils/jwt.js';

describe('JWT Utilities', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const roles = ['tenant'] as const;

  describe('Access Token', () => {
    it('signs and verifies a valid access token', () => {
      const token = signAccessToken(userId, [...roles]);
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.roles).toEqual(['tenant']);
    });

    it('access token payload contains only sub and roles — no PII', () => {
      const token = signAccessToken(userId, ['tenant', 'landlord']);
      const payload = verifyAccessToken(token);
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('name');
      expect(payload).not.toHaveProperty('avatarUrl');
      expect(payload.sub).toBe(userId);
      expect(payload.roles).toEqual(['tenant', 'landlord']);
    });

    it('throws on a tampered access token', () => {
      const token = signAccessToken(userId, [...roles]);
      const tampered = token.slice(0, -5) + 'AAAAA';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('Refresh Token', () => {
    it('signs and verifies a valid refresh token', () => {
      const token = signRefreshToken(userId);
      const payload = verifyRefreshToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('refresh');
    });

    it('throws when presented an access token as a refresh token', () => {
      const accessToken = signAccessToken(userId, [...roles]);
      // Access tokens are signed with a different secret — verification should throw
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it('throws on a tampered refresh token', () => {
      const token = signRefreshToken(userId);
      const tampered = token.slice(0, -5) + 'BBBBB';
      expect(() => verifyRefreshToken(tampered)).toThrow();
    });
  });
});
