export type Difficulty = "easy" | "medium" | "hard";
export type PlanDifficulty = "gentle" | "normal" | "accelerated";
export type TaskType = "study" | "build" | "review" | "exercise";
export type TaskStatus = "pending" | "completed" | "skipped" | "failed";
export type DayStatus = "pending" | "in_progress" | "completed" | "skipped";
export type PlanStatus = "active" | "completed" | "superseded";
export type ProjectStatus = "active" | "completed";
export type MilestoneStatus = "pending" | "completed";

export interface Task {
  id: string;
  planDayId: string;
  userId: string;
  position: number;
  type: TaskType;
  title: string;
  description: string | null;
  resourceUrl: string | null;
  durationMin: number | null;
  difficulty: Difficulty;
  status: TaskStatus;
  completedAt: string | null;
}

export interface PlanDay {
  id: string;
  planId: string;
  userId: string;
  dayNumber: number;
  dateOn: string;
  theme: string;
  summary: string | null;
  status: DayStatus;
  tasks: Task[];
}

export interface LearningPlan {
  id: string;
  userId: string;
  weekNumber: number;
  status: PlanStatus;
  difficulty: PlanDifficulty;
  startsOn: string;
  endsOn: string;
  days: PlanDay[];
}

export interface Milestone {
  id: string;
  projectId: string;
  userId: string;
  position: number;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  completedAt: string | null;
}

export interface Project {
  id: string;
  userId: string;
  planId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startedAt: string;
  completedAt: string | null;
  milestones: Milestone[];
}

export interface ClaudeTask {
  position: number;
  type: TaskType;
  title: string;
  description: string;
  resourceUrl: string | null;
  durationMin: number;
  difficulty: Difficulty;
  why?: string;
}

export interface ClaudeDay {
  dayNumber: number;
  theme: string;
  summary: string;
  hook?: string;
  tasks: ClaudeTask[];
}

export interface ClaudeMilestone {
  position: number;
  title: string;
  description: string;
}

export interface ClaudePlanJSON {
  difficulty: PlanDifficulty;
  narrative?: string;
  days: ClaudeDay[];
  project: {
    name: string;
    description: string;
    milestones: ClaudeMilestone[];
  };
}
