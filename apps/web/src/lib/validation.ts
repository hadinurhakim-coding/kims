export interface ValidationResult {
  valid: boolean;
  message: string | null;
}

export const validate = {
  name: (value: string): ValidationResult => {
    if (!value.trim()) {
      return { valid: false, message: "Name is required" };
    }

    if (value.trim().length < 2) {
      return {
        valid: false,
        message: "Name must be at least 2 characters",
      };
    }

    return { valid: true, message: null };
  },

  email: (value: string): ValidationResult => {
    if (!value.trim()) {
      return { valid: false, message: "Email is required" };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return {
        valid: false,
        message: "Enter a valid email address",
      };
    }

    return { valid: true, message: null };
  },

  password: (value: string): ValidationResult => {
    if (!value) {
      return { valid: false, message: "Password is required" };
    }

    if (value.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
    }

    return { valid: true, message: null };
  },

  confirmPassword: (value: string, original: string): ValidationResult => {
    if (!value) {
      return {
        valid: false,
        message: "Please confirm your password",
      };
    }

    if (value !== original) {
      return {
        valid: false,
        message: "Passwords do not match",
      };
    }

    return { valid: true, message: null };
  },
};
