export type InsightCard = {
  topic: string;
  count: number;
  title: string;
  detail: string;
};

export type TopicCount = {
  topic: string;
  count: number;
};

export type InsightsPayload = {
  unlocked: boolean;
  sessionCount: number;
  mistakeCount: number;
  unlockAtSessions: number;
  message: string | null;
  weaknesses: InsightCard[];
  strengths: InsightCard[];
  focusNext: string[];
  topicCounts: TopicCount[];
};
