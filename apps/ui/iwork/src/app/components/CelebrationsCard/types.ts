export interface CelebrationCard {
  employeeId: number;
  userId: number;
  fullName: string;
  emailId: string;
  celebrationType: "BIRTHDAY" | "WORK_ANNIVERSARY";
  celebrationDate: Date | string;
  profileUrl: string;
}
