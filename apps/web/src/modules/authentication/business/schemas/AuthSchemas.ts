import { z } from 'zod';

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignInDto = z.infer<typeof SignInSchema>;

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^\w\d\s:]/, 'Password must contain at least one special character');

export const SignUpSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters').max(100),
    last_name: z.string().min(2, 'Last name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    repassword: z.string(),
  })
  .refine((data) => data.password === data.repassword, {
    message: "Passwords don't match",
    path: ['repassword'],
  });

export type SignUpDto = z.infer<typeof SignUpSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    repassword: z.string(),
  })
  .refine((data) => data.password === data.repassword, {
    message: "Passwords don't match",
    path: ['repassword'],
  });

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
