/**
 * Tests for validation utilities
 */

// Simple validation functions for testing
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password length', () => {
      expect(validatePassword('pass123456').valid).toBe(true);
      expect(validatePassword('verylongpassword').valid).toBe(true);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should accept exactly 8 characters', () => {
      expect(validatePassword('12345678').valid).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('a')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
    });
  });
});
