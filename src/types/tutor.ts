export interface Gap {
  concept: string;
  severity: "low" | "med" | "high";
  evidence: string;
}

export interface ProjectAssignment {
  title: string;
  description: string;
  acceptance_criteria: string[];
}

export interface TutorSessionResult {
  gaps: Gap[];
  projectAssignment: ProjectAssignment;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}
