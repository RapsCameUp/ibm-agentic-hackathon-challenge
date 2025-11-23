import { z } from 'zod';

export const formSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  age: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 18 && num <= 120;
  }, 'Must be between 18 and 120'),
  weight: z.string().min(1, 'Weight is required'),
  height: z.string().min(1, 'Height is required'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
    message: 'Please select your gender',
  }),
  symptoms: z.string().min(10, 'Please describe your symptoms (minimum 10 characters)'),
  medicalHistory: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goals: z.string().min(5, 'Please specify your health goals'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy to continue',
  }),
});

export type FormData = z.infer<typeof formSchema>;
