import { z } from "zod";

export const authEmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const authPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: authEmailSchema,
    password: authPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  dotNumber: z.string().trim().max(50).optional(),
  fleetSize: z.coerce.number().int().min(0).max(100000).optional(),
});

export const inviteMemberSchema = z.object({
  companyId: z.string().uuid(),
  email: authEmailSchema,
  role: z.enum(["admin", "dispatcher", "driver", "viewer"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
