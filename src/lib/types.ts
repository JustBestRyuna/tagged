export interface SolvedacProblem {
  problemId: number;
  titleKo: string;
  titles: { language: string; title: string; }[];
  level: number;
  acceptedUserCount: number;
  averageTries: number;
  tags: {
    key: string;
    displayNames: { language: string; name: string; }[];
    isMeta: boolean;
  }[];
  classes: { class: number }[];
}