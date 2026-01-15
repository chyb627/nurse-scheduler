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
  experience: number; // 경력 (년차)
}

export interface NurseStats {
  offDays: number;
  workDays: number;
  consecutiveWork: number;
  consecutiveNights: number; // 연속 나이트 횟수
  totalNights: number; // 총 나이트 근무 횟수
  lastShift: string | null;
  offCountAfterNight: number; // 나이트 후 OFF 카운트
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
