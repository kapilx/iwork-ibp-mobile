export interface ReportParameter {
  name: string;
  label: string;
  dataType: string;
}

export interface ReportDefinition {
  id: number;
  name: string;
  label: string;
  endpoint: string;
  query: string;
  parameters: ReportParameter[];
}

export const USER_ACTIVITY_REPORT_QUERY =
  'select * from vr_user_activity where "Event Time"::Date between START_DATE::Date and END_DATE::Date ORDER BY "Event Time" DESC;';

export const USER_ACTIVITY_AGGREGATED_REPORT_QUERY =
  'select "Entity Type","Performed By","Operation",Count("Performed By") from vr_user_activity where "Event Time"::Date between START_DATE::Date and END_DATE::Date group by "Entity Type","Performed By","Operation" order by "Entity Type" desc;';

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 1,
    name: 'user_activity',
    label: 'User Activity',
    endpoint: '/user-activity',
    query: USER_ACTIVITY_REPORT_QUERY,
    parameters: [
      { name: 'startDate', label: 'Start Date', dataType: 'date' },
      { name: 'endDate', label: 'End Date', dataType: 'date' },
    ],
  },
  {
    id: 2,
    name: 'user_activity_aggregated',
    label: 'User Activity Aggregated',
    endpoint: '/user-activity-aggregated',
    query: USER_ACTIVITY_AGGREGATED_REPORT_QUERY,
    parameters: [
      { name: 'startDate', label: 'Start Date', dataType: 'date' },
      { name: 'endDate', label: 'End Date', dataType: 'date' },
    ],
  },
];
