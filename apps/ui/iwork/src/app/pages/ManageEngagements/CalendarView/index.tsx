import CalendarWeekView from "../../../components/CalendarWeekView";
import { Task, Meeting,Approval, Note } from "../type";

interface CalendarViewProps {
  tasks?: Task[];
  meetings?: Meeting[];
  approval?: Task[];
  assignment?: Task[];
  sales?: Task[];
  notes?: Note[];
  type: string;
  onEditTask?: (task: Task) => void;
  onEditMeeting?: (meeting: Meeting) => void;
  onEditNotes?: (note: Note) => void;
  onDeleteTask?: (task: Task) => void;
  onMoveTask?: (id: string | number, date: Date) => void;
  onCompleteTask?: (task: Task, completed: boolean) => void;
  onNavigateTask?: (task: Task) => void;
  onFeedbackMeeting?: (meeting: Meeting) => void;
  onDataChanged?: ()=> void;
  showCompleted?: boolean;
  fetchTasks?: () => void;
  fetchMeetings?: () => void;
  currentDate?: Date;
  onChangeDate?: (date: Date) => void;
}

const CalenderView: React.FC<CalendarViewProps> = (props) => {
  return <CalendarWeekView {...props} />;
};

export default CalenderView;
