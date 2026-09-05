// All types and constants moved from index.tsx

export type ActivityType = 'task' | 'meeting' | 'note' | 'sales' | 'approval' |'assignment';

export interface Activity {
  id: string | number;
  activityType: ActivityType;
  status: 'active' | 'completed';
  date: string;
  title: string;
  description: string;
  priority?: string; // for task
  meetingType?: string; // for meeting
  taskType?: string; // for task
  taskStatus?: string; // for task
}

export interface Task {
  id: number;
  taskName: string;
  dueDate: string;
  taskIsEditable: string | null;
  description: string;
  company: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  assignee: {
    userId: number;
    firstName: string;
    lastName: string;
  } | null;
  opportunity: {
    opportunityId: number;
    policy: string;
  } | null;
  activity: {
    id: number;
    activityName: string;
  } | null;
  priority: {
    id: number;
    lookUpValue: string;
  } ;
  taskStatus:  string;
  taskStatusLid?: number;
  taskType: {
    id: number;
    lookUpValue: string;
  } ;
}

export interface Meeting {
  id: number;
  meetingDate: string;
  startTime: Record<string, unknown>;
  endTime: Record<string, unknown>;
  location:  {
    id: number;
    lookUpValue: string;
  } ;
  meetingSubject: string;
  meetingAgenda: string;
  company: unknown | null;
  contact: unknown | null;
  opportunity: unknown | null;
  activity: unknown | null;
  meetingType:  {
    id: number;
    lookUpValue: string;
  } ;
  meetingStatus:  {
    id: number;
    lookUpValue: string;
  } ;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  date: string;
}

export const chipStyleMap = {
  high: {
    color: '#FF4800',
    dotColor: '#FF4800',
  },
  medium: {
    color: '#FFCD05',
    dotColor: '#FFCD05',
  },
  low: {
    color: '#4E61EC',
    dotColor: '#4E61EC',
  },
  task: {
    backgroundColor: '#F2F6FF',
    color: '#4E61EC',
  },
  meeting: {
    backgroundColor: '#f9faff',
    color: '#FF3EAB',
  },
  note: {
    backgroundColor: '#FF710426',
    color: '#FF7104',
  },
};
export interface IconButtonSvgProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
