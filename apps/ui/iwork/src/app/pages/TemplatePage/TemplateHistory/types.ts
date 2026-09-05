export interface HistoryRecord {
    id: number;
    action: string;
    fromStatus: string;
    toStatus: string;
    comment?: string;
    performedBy: number;
    performedByName?: string;
    performedAt: string;
}