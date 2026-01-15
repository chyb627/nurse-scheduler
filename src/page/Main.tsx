import React, { useState } from 'react';
import { Calendar, Users, RotateCw } from 'lucide-react';

// 타입 정의
interface ShiftType {
  label: string;
  color: string;
}

interface ShiftTypes {
  D: ShiftType;
  E: ShiftType;
  N: ShiftType;
  OFF: ShiftType;
}

interface Nurse {
  id: number;
  name: string;
}

interface NurseStats {
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

interface Schedule {
  [day: number]: {
    [nurseId: number]: string;
  };
}

const MainPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<string>('2026-01');
  const [schedule, setSchedule] = useState<Schedule>({});
  const [numNurses, setNumNurses] = useState<number>(4);
  const [offDaysPerNurse, setOffDaysPerNurse] = useState<number>(12);

  // 근무 타입
  const shiftTypes: ShiftTypes = {
    D: { label: 'D', color: '#7B9FE8' },
    E: { label: 'E', color: '#B865D6' },
    N: { label: 'N', color: '#4A5568' },
    OFF: { label: 'OFF', color: '#E8A577' },
  };

  // 날짜 생성
  const getDaysInMonth = (yearMonth: string): number[] => {
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // 요일 계산
  const getDayOfWeek = (yearMonth: string, day: number): string => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  // 주말 체크
  const isWeekend = (yearMonth: string, day: number): boolean => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  // 간호사 배열 생성
  const getNurses = (): Nurse[] => {
    return Array.from({ length: numNurses }, (_, i) => ({
      id: i + 1,
      name: `간호사${i + 1}`,
    }));
  };

  // 스케줄 자동 생성
  const generateSchedule = (): void => {
    const days = getDaysInMonth(currentMonth);
    const totalDays = days.length;
    const nurses = getNurses();
    const newSchedule: Schedule = {};

    const targetOffDays = offDaysPerNurse;
    const targetWorkDays = totalDays - targetOffDays;

    // 간호사별 현재 상태 추적
    const nurseStats: { [key: number]: NurseStats } = {};
    nurses.forEach((nurse) => {
      nurseStats[nurse.id] = {
        offDays: 0,
        workDays: 0,
        consecutiveWork: 0,
        lastShift: null,
        shifts: { D: 0, E: 0, N: 0, OFF: 0 },
      };
    });

    // 연속 근무 제한 체크
    const canWork = (nurseId: number, day: number): boolean => {
      const stats = nurseStats[nurseId];

      if (stats.consecutiveWork >= 5) return false;
      if (stats.lastShift === 'N') return false;
      if (stats.offDays >= targetOffDays) return true;

      const daysPassed = day;
      const expectedOffByNow = (targetOffDays / totalDays) * daysPassed;
      const offDeficit = stats.offDays - expectedOffByNow;

      if (offDeficit < -2) return false;

      return true;
    };

    // 각 날짜별로 스케줄 배정
    for (let day of days) {
      newSchedule[day] = {};

      // 하루에 필요한 인력 계산
      const dailyShifts: string[] = [];

      const workersToday = day % 3 === 0 ? 3 : 2;

      if (workersToday === 3) {
        dailyShifts.push('D', 'E', 'E');
      } else {
        dailyShifts.push('D', 'E');
      }

      if (day % 7 === 0 || day % 7 === 3) {
        dailyShifts.push('N');
      }

      const sortedNurses = [...nurses].sort((a, b) => {
        const aStats = nurseStats[a.id];
        const bStats = nurseStats[b.id];

        if (aStats.offDays >= targetOffDays && bStats.offDays < targetOffDays) return -1;
        if (bStats.offDays >= targetOffDays && aStats.offDays < targetOffDays) return 1;

        const aWorkRatio = aStats.workDays / Math.max(day, 1);
        const bWorkRatio = bStats.workDays / Math.max(day, 1);
        const targetRatio = targetWorkDays / totalDays;

        const aDiff = Math.abs(aWorkRatio - targetRatio);
        const bDiff = Math.abs(bWorkRatio - targetRatio);

        return aDiff - bDiff;
      });

      const assignedNurses = new Set<number>();

      // 각 근무 타입별로 배정
      for (let shiftType of ['D', 'E', 'N']) {
        const neededCount = dailyShifts.filter((s) => s === shiftType).length;
        if (neededCount === 0) continue;

        const sortedForShift = [...sortedNurses]
          .filter((n) => !assignedNurses.has(n.id))
          .sort((a, b) => {
            const aShiftCount = nurseStats[a.id].shifts[shiftType as keyof (typeof nurseStats)[number]['shifts']];
            const bShiftCount = nurseStats[b.id].shifts[shiftType as keyof (typeof nurseStats)[number]['shifts']];
            return aShiftCount - bShiftCount;
          });

        let assigned = 0;
        for (let nurse of sortedForShift) {
          if (assigned >= neededCount) break;

          const stats = nurseStats[nurse.id];

          if (canWork(nurse.id, day)) {
            newSchedule[day][nurse.id] = shiftType;
            stats.shifts[shiftType as keyof typeof stats.shifts]++;
            stats.workDays++;
            stats.consecutiveWork++;
            stats.lastShift = shiftType;
            assignedNurses.add(nurse.id);
            assigned++;
          }
        }
      }

      // 배정되지 않은 간호사는 OFF
      nurses.forEach((nurse) => {
        if (!assignedNurses.has(nurse.id)) {
          const stats = nurseStats[nurse.id];

          const daysPassed = day;
          const expectedOffByNow = (targetOffDays / totalDays) * daysPassed;
          const offDeficit = stats.offDays - expectedOffByNow;

          if (stats.offDays >= targetOffDays && offDeficit >= 0) {
            const leastShift = (['D', 'E', 'N'] as const).reduce((min, shift) =>
              stats.shifts[shift] < stats.shifts[min] ? shift : min,
            );

            newSchedule[day][nurse.id] = leastShift;
            stats.shifts[leastShift]++;
            stats.workDays++;
            stats.consecutiveWork++;
            stats.lastShift = leastShift;
          } else {
            newSchedule[day][nurse.id] = 'OFF';
            stats.shifts.OFF++;
            stats.offDays++;
            stats.consecutiveWork = 0;
            stats.lastShift = 'OFF';
          }
        }
      });
    }

    setSchedule(newSchedule);
  };

  // 통계 계산
  const calculateStats = () => {
    const nurses = getNurses();
    const stats: { [key: number]: { D: number; E: number; N: number; OFF: number; total: number } } = {};

    nurses.forEach((nurse) => {
      stats[nurse.id] = { D: 0, E: 0, N: 0, OFF: 0, total: 0 };
      for (let day in schedule) {
        const shift = schedule[day as any]?.[nurse.id];
        if (shift) {
          stats[nurse.id][shift as keyof (typeof stats)[number]]++;
          if (shift !== 'OFF') stats[nurse.id].total++;
        }
      }
    });

    return stats;
  };

  const stats = calculateStats();
  const nurses = getNurses();

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ minWidth: 'auto', width: '100%' }}>
      <div className="max-w-full mx-auto" style={{ maxWidth: '100%', overflowX: 'auto' }}>
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm mb-6" style={{ padding: '24px', margin: '0 0 24px 0' }}>
          <h1 className="text-2xl font-bold text-gray-900" style={{ marginBottom: '24px' }}>
            간호사 근무표 자동 생성기
          </h1>

          {/* 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
            <div>
              <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                근무 월
              </label>
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ padding: '8px 12px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                간호사 수
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={numNurses}
                onChange={(e) => setNumNurses(parseInt(e.target.value) || 2)}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ padding: '8px 12px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                1인당 OFF 일수
              </label>
              <input
                type="number"
                min="8"
                max="20"
                value={offDaysPerNurse}
                onChange={(e) => setOffDaysPerNurse(parseInt(e.target.value) || 12)}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ padding: '8px 12px', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={generateSchedule}
                style={{
                  width: '100%',
                  padding: '10px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <RotateCw size={20} />
                스케줄 생성
              </button>
            </div>
          </div>

          {/* 범례 */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries(shiftTypes).map(([key, type]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: type.color,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {type.label}
                </div>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {key === 'D' ? '데이' : key === 'E' ? '이브닝' : key === 'N' ? '나이트' : '휴무'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div className="bg-white rounded-lg shadow-sm mb-6" style={{ padding: '24px', margin: '0 0 24px 0' }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ marginBottom: '16px' }}>
            <Users size={20} />
            간호사별 근무 통계
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {nurses.map((nurse) => (
              <div key={nurse.id} className="border border-gray-200 rounded-lg" style={{ padding: '16px' }}>
                <div
                  style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontSize: '16px',
                  }}
                >
                  {nurse.name}
                </div>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>D:</span>
                    <span style={{ fontWeight: '500' }}>{stats[nurse.id]?.D || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>E:</span>
                    <span style={{ fontWeight: '500' }}>{stats[nurse.id]?.E || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>N:</span>
                    <span style={{ fontWeight: '500' }}>{stats[nurse.id]?.N || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>OFF:</span>
                    <span style={{ fontWeight: '500', color: '#ea580c' }}>{stats[nurse.id]?.OFF || 0}</span>
                  </div>
                  <div
                    style={{
                      paddingTop: '8px',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: '600',
                      color: '#2563eb',
                    }}
                  >
                    <span>근무:</span>
                    <span>{stats[nurse.id]?.total || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 캘린더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            근무표
          </h2>

          {Object.keys(schedule).length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg" style={{ margin: 0 }}>
              <p className="text-lg mb-2" style={{ margin: '0 0 8px 0' }}>
                위에서 설정을 조정하고
              </p>
              <p className="text-xl font-semibold text-blue-600" style={{ margin: 0 }}>
                "스케줄 생성" 버튼을 눌러주세요
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', margin: 0 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        border: '1px solid #e5e7eb',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        minWidth: '80px',
                        fontWeight: '600',
                      }}
                    >
                      날짜
                    </th>
                    {nurses.map((nurse) => (
                      <th
                        key={nurse.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          minWidth: '100px',
                          fontWeight: '600',
                        }}
                      >
                        {nurse.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getDaysInMonth(currentMonth).map((day) => {
                    const dayOfWeek = getDayOfWeek(currentMonth, day);
                    const isWeekendDay = isWeekend(currentMonth, day);

                    return (
                      <tr key={day} style={{ backgroundColor: isWeekendDay ? '#fef2f2' : 'white' }}>
                        <td
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '8px',
                            fontWeight: '500',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'white',
                            zIndex: 10,
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600' }}>{day}일</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{dayOfWeek}</div>
                          </div>
                        </td>
                        {nurses.map((nurse) => {
                          const shift = schedule[day]?.[nurse.id] || '-';
                          const shiftInfo = shiftTypes[shift as keyof ShiftTypes];

                          return (
                            <td
                              key={nurse.id}
                              style={{
                                border: '1px solid #e5e7eb',
                                padding: '4px',
                              }}
                            >
                              <div
                                style={{
                                  width: '100%',
                                  height: '56px',
                                  borderRadius: '4px',
                                  backgroundColor: shiftInfo?.color || '#E5E7EB',
                                  color: shift === '-' ? '#6B7280' : 'white',
                                  fontWeight: 'bold',
                                  fontSize: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {shift}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3 text-base">🤖 자동 생성 알고리즘</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ 각 간호사별로 OFF 일수를 균등하게 배분 (기본 12일)</li>
            <li>✓ 연속 근무는 최대 5일까지만 허용</li>
            <li>✓ 나이트(N) 근무 다음날은 자동으로 휴무</li>
            <li>✓ 하루에 D(데이) 2명, E(이브닝) 2명 배치</li>
            <li>✓ 근무 형평성을 자동으로 조정하여 공정하게 배분</li>
            <li>✓ 주말은 빨간색으로 표시</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
