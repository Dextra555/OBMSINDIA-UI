/**
 * Mirrors the backend AttendancePeriodDto.
 * Returned by GET /api/payroll/GetAttendancePeriod?clientCode=&year=&month=
 */
export interface AttendancePeriodResult {
  /** First date of the attendance cycle (inclusive). */
  StartDate: string;
  /** Last date of the attendance cycle (inclusive). */
  EndDate: string;
  /**
   * Canonical value stored in Attendance.Period (last day of reference month).
   * Use this when constructing the Period field on save.
   */
  PeriodKey: string;
  /** true when client has a non-calendar-month cycle. */
  IsCustom: boolean;
  /** Total calendar days in the cycle. */
  TotalDays: number;
  /** Human-readable label, e.g. "25-Apr-2026 to 26-May-2026". */
  Label: string;
}

/** Config DTO for the client attendance period settings screen. */
export interface ClientAttendancePeriodConfig {
  ID: number;
  ClientCode: string;
  PeriodStartDay: number;
  PeriodEndDay: number;
  IsCustomPeriod: boolean;
  PreviewLabel?: string;
}
