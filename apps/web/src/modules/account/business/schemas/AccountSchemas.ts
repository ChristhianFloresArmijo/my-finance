import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  website: z.string().url('Invalid URL').optional(),
  location: z.string().max(100).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export const UpdateAvatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size <= 5000000, { message: 'File size must be less than 5MB' })
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      { message: 'Only JPEG, PNG, and WebP images are allowed' }
    ),
});

export type UpdateAvatarDto = z.infer<typeof UpdateAvatarSchema>;

export const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'es', 'fr', 'de']).optional(),
  notifications: z
    .object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    })
    .optional(),
  timezone: z.string().optional(),
});

export type UpdatePreferencesDto = z.infer<typeof UpdatePreferencesSchema>;
