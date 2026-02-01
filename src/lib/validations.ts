import { z } from "zod";

// Common validation patterns
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Patient validation schema
export const patientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(nameRegex, "El nombre contiene caracteres inválidos"),
  lastName: z
    .string()
    .trim()
    .min(1, "El apellido es requerido")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .regex(nameRegex, "El apellido contiene caracteres inválidos"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(phoneRegex, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .max(20, "El WhatsApp no puede exceder 20 caracteres")
    .regex(phoneRegex, "Formato de WhatsApp inválido")
    .optional()
    .or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z
    .string()
    .trim()
    .max(255, "La dirección no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100, "La ciudad no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .trim()
    .max(100, "El estado no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .max(20, "El código postal no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  emergencyContactName: z
    .string()
    .trim()
    .max(100, "El nombre del contacto no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(20, "El teléfono del contacto no puede exceder 20 caracteres")
    .regex(phoneRegex, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
  allergies: z
    .string()
    .trim()
    .max(500, "Las alergias no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  medications: z
    .string()
    .trim()
    .max(500, "Los medicamentos no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  medicalNotes: z
    .string()
    .trim()
    .max(2000, "Las notas médicas no pueden exceder 2000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Treatment validation schema
export const treatmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  price: z
    .string()
    .refine((val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "El precio debe ser un número válido mayor o igual a 0",
    })
    .optional()
    .or(z.literal("")),
  duration_minutes: z.number().min(5, "La duración mínima es 5 minutos").max(480, "La duración máxima es 8 horas"),
  category: z
    .string()
    .trim()
    .max(50, "La categoría no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
});

export type TreatmentFormData = z.infer<typeof treatmentSchema>;

// Notes validation (for payments, budgets, etc.)
export const notesSchema = z
  .string()
  .trim()
  .max(1000, "Las notas no pueden exceder 1000 caracteres")
  .optional()
  .or(z.literal(""));

// Helper function to validate and get errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (path) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors };
}
