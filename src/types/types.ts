// 타입 정의
export interface ShiftType {
  label: string;
  color: string;
}

export interface ShiftTypes {
  D: ShiftType;
  E: ShiftType;
  N: ShiftType;
  OFF: ShiftType;
}

export interface Nurse {
  id: number;
  name: string;
  preferences?: { [day: number]: string }; // 선호 근무 타입
}

export interface NurseStats {
  offDays: number;
  workDays: number;
  consecutiveWork: number;
  lastShift: string | null;
  shifts: {
    D: number;
    E: number;
    N: number;
    OFF: number;
  };
}

export interface Schedule {
  [day: number]: {
    [nurseId: number]: string;
  };
}
