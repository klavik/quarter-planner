import { z } from 'zod';

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
export const RoleSchema = z.enum(["owner", "admin", "planner", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export const WorkspaceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workspace name is required"),
  defaultIterationDays: z.number().int().positive().default(14),
  createdAt: z.string().datetime(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const MemberSchema = z.object({
  userId: z.string(),
  role: RoleSchema,
  joinedAt: z.string().datetime(),
});
export type Member = z.infer<typeof MemberSchema>;

export const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Must be a valid HEX color").optional(),
});
export type Team = z.infer<typeof TeamSchema>;

export const ResourceTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
});
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const PersonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  baseCapacityPerWeek: z.number().min(0).max(7).default(5),
  homeTeamId: z.string().min(1),
  primaryResourceTypeId: z.string().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

// Спринты (iterations) убраны из схемы
export const PlanningPeriodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  dateStart: DateStringSchema,
  dateEnd: DateStringSchema,
});
export type PlanningPeriod = z.infer<typeof PlanningPeriodSchema>;

export const InitiativeStatusSchema = z.enum([
  'proposed', 'approved', 'approved_no_resources', 'needs_work', 'cancelled'
]);
export type InitiativeStatus = z.infer<typeof InitiativeStatusSchema>;

export const InitiativeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  businessValue: z.string().optional(),
  status: InitiativeStatusSchema.default('proposed'),
  createdAt: z.string().datetime(),
});
export type Initiative = z.infer<typeof InitiativeSchema>;

export const TaskStatusSchema = z.enum([
  'planned', 'in_progress', 'completed', 'cancelled', 'failed'
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  initiativeId: z.string().min(1),
  teamId: z.string().min(1),
  status: TaskStatusSchema.default('planned'),
  statusReason: z.string().optional(),
  description: z.string().optional(),
  resourceOffsets: z.record(z.string(), z.number()).optional(),
  roleOrder: z.array(z.string()).optional(),
  estimates: z.record(z.string(), z.number().min(0)).default({}),
  
  // Новые поля для Ганта вместо iterationId
  dateStart: DateStringSchema.optional(),
  dateEnd: DateStringSchema.optional(),
  
  createdAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;
