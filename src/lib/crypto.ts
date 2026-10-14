/**
 * Cryptographic & Password Security Utilities for SobatDagang
 * Uses native Web Crypto API (SubtleCrypto) - zero external dependencies
 */

/**
 * Hash a plain text password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain text password against a stored SHA-256 hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const calculatedHash = await hashPassword(password);
  return calculatedHash === storedHash;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  label: string;
  color: string;
  textColor: string;
  feedback: string;
}

/**
 * Calculate password strength score and visual feedback
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      label: 'Belum diisi',
      color: 'bg-ink/20',
      textColor: 'text-muted',
      feedback: 'Minimal 6 karakter kombinasi huruf dan angka',
    };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;

  // Complexity checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const diversity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (diversity >= 2) score += 1;
  if (diversity >= 3 && password.length >= 8) score += 1;

  // Normalize 0 - 4
  const finalScore = Math.min(4, Math.max(1, score));

  switch (finalScore) {
    case 1:
      return {
        score: 1,
        level: 'weak',
        label: 'Lemah',
        color: 'bg-pink border-pink',
        textColor: 'text-[#b42b58]',
        feedback: 'Terlalu pendek atau mudah ditebak. Tambahkan angka atau perpanjang.',
      };
    case 2:
      return {
        score: 2,
        level: 'medium',
        label: 'Sedang',
        color: 'bg-yellow border-yellow',
        textColor: 'text-[#9c7802]',
        feedback: 'Cukup baik. Kombinasikan huruf besar, angka, atau simbol agar lebih kuat.',
      };
    case 3:
      return {
        score: 3,
        level: 'strong',
        label: 'Kuat',
        color: 'bg-green border-green',
        textColor: 'text-[#446622]',
        feedback: 'Bagus! Password ini memiliki tingkat keamanan yang baik.',
      };
    case 4:
    default:
      return {
        score: 4,
        level: 'very-strong',
        label: 'Sangat Kuat',
        color: 'bg-green border-green',
        textColor: 'text-[#2e4c13]',
        feedback: 'Sangat aman dan memenuhi standar keamanan tinggi.',
      };
  }
}

/**
 * Generate a secure, user-friendly temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$';
  let result = '';
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%';
  
  result += letters.charAt(Math.floor(Math.random() * letters.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));
  result += symbols.charAt(Math.floor(Math.random() * symbols.length));

  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.split('').sort(() => 0.5 - Math.random()).join('');
}
