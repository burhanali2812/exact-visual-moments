import { z } from 'zod';
import { CATEGORIES } from './data';

export const complaintSchema = z.object({
  title: z.string().trim().min(3).max(80),
  category: z.string().refine((value) => CATEGORIES.includes(value)),
  description: z.string().trim().min(6).max(1000),
  anonymous: z.boolean(),
  attachments: z.array(z.string()).max(3),
});
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100), program: z.string().trim().min(1),
  roll: z.string().trim().min(1).max(50), phone: z.string().trim().min(1).max(30),
});