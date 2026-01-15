import type { Nurse, NurseStats, Schedule, ShiftTypes } from '@/types/types';
import React, { useState } from 'react';
import { Calendar, Users, RotateCw } from 'lucide-react';

const NurseScheduleApp: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<string>('2026-01');
  const [schedule, setSchedule] = useState<Schedule>({});
  const [numNurses, setNumNurses] = useState<number>(10);
  const [offDaysPerNurse, setOffDaysPerNurse] = useState<number>(12);
  const [selectedNurseForCalendar, setSelectedNurseForCalendar] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [nurses, setNurses] = useState<Nurse[]>([
    { id: 1, name: '간호사1', preferences: {}, experience: 1 },
    { id: 2, name: '간호사2', preferences: {}, experience: 3 },
    { id: 3, name: '간호사3', preferences: {}, experience: 5 },
    { id: 4, name: '간호사4', preferences: {}, experience: 2 },
    { id: 5, name: '간호사5', preferences: {}, experience: 7 },
    { id: 6, name: '간호사6', preferences: {}, experience: 4 },
    { id: 7, name: '간호사7', preferences: {}, experience: 10 },
    { id: 8, name: '간호사8', preferences: {}, experience: 6 },
    { id: 9, name: '간호사9', preferences: {}, experience: 8 },
    { id: 10, name: '간호사10', preferences: {}, experience: 3 },
  ]);

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
    return nurses;
  };

  // 간호사 수 변경 시 자동으로 추가/제거
  React.useEffect(() => {
    if (numNurses > nurses.length) {
      // 간호사 추가
      const newNurses = [...nurses];
      for (let i = nurses.length; i < numNurses; i++) {
        newNurses.push({
          id: i + 1,
          name: `간호사${i + 1}`,
          preferences: {},
          experience: Math.floor(Math.random() * 10) + 1, // 1-10년차 랜덤
        });
      }
      setNurses(newNurses);
    } else if (numNurses < nurses.length) {
      // 간호사 제거
      setNurses(nurses.slice(0, numNurses));
    }
  }, [numNurses]);

  // 간호사 이름 변경
  const updateNurseName = (id: number, newName: string) => {
    setNurses(nurses.map((nurse) => (nurse.id === id ? { ...nurse, name: newName } : nurse)));
  };

  // 간호사 경력 변경
  const updateNurseExperience = (id: number, experience: number) => {
    setNurses(nurses.map((nurse) => (nurse.id === id ? { ...nurse, experience } : nurse)));
  };

  // 간호사 선호 근무 설정
  const updateNursePreference = (nurseId: number, day: number, shift: string) => {
    setNurses(
      nurses.map((nurse) => {
        if (nurse.id === nurseId) {
          const newPreferences = { ...nurse.preferences };
          if (shift === '') {
            delete newPreferences[day];
          } else {
            newPreferences[day] = shift;
          }
          return { ...nurse, preferences: newPreferences };
        }
        return nurse;
      }),
    );
  };

  // 스케줄 자동 생성
  const generateSchedule = async (): Promise<void> => {
    setIsGenerating(true);

    // 약간의 딜레이로 로딩 표시
    await new Promise((resolve) => setTimeout(resolve, 500));

    const days = getDaysInMonth(currentMonth);
    const totalDays = days.length;
    const currentNurses = getNurses();
    const newSchedule: Schedule = {};

    const targetOffDays = offDaysPerNurse;
    const targetWorkDays = totalDays - targetOffDays;

    // 간호사별 현재 상태 추적
    const nurseStats: { [key: number]: NurseStats } = {};
    currentNurses.forEach((nurse) => {
      nurseStats[nurse.id] = {
        offDays: 0,
        workDays: 0,
        consecutiveWork: 0,
        consecutiveNights: 0,
        totalNights: 0,
        lastShift: null,
        offCountAfterNight: 0,
        shifts: { D: 0, E: 0, N: 0, OFF: 0 },
      };
    });

    // 연속 근무 제한 체크 (강화된 규칙)
    const canWork = (nurseId: number, day: number, shiftType?: string): boolean => {
      const stats = nurseStats[nurseId];

      // 규칙 1: 나이트 → OFF → 데이 패턴 금지
      if (stats.lastShift === 'OFF' && shiftType === 'D') {
        // 전전날이 나이트였는지 체크
        if (day >= 3) {
          const twoDaysAgo = newSchedule[day - 2]?.[nurseId];
          if (twoDaysAgo === 'N') return false;
        }
      }

      // 규칙 2: 연속 근무 최대 5일
      if (stats.consecutiveWork >= 5 && shiftType !== 'OFF') return false;

      // 규칙 3: 나이트 후 OFF 2일 필수
      if (stats.offCountAfterNight > 0 && stats.offCountAfterNight < 2 && shiftType !== 'OFF') {
        return false;
      }

      // 규칙 4: 월 나이트 3회 이상 금지
      if (shiftType === 'N' && stats.totalNights >= 3) return false;

      // 규칙 5: E 다음 D 금지
      if (stats.lastShift === 'E' && shiftType === 'D') return false;

      // 나이트 다음날은 무조건 OFF
      if (stats.lastShift === 'N' && shiftType !== 'OFF') return false;

      // OFF 목표치를 달성했으면 근무 가능
      if (stats.offDays >= targetOffDays) return true;

      const daysPassed = day;
      const expectedOffByNow = (targetOffDays / totalDays) * daysPassed;
      const offDeficit = stats.offDays - expectedOffByNow;

      if (offDeficit < -2) return false;

      return true;
    };

    // 경력에 따른 그룹 분류 (규칙 7: 총괄 배치)
    const seniorNurses = currentNurses.filter((n) => n.experience >= 5).sort((a, b) => b.experience - a.experience);
    const midNurses = currentNurses.filter((n) => n.experience >= 3 && n.experience < 5);
    const juniorNurses = currentNurses.filter((n) => n.experience < 3);

    // 랜덤 셔플 함수
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 각 날짜별로 스케줄 배정
    for (let day of days) {
      newSchedule[day] = {};

      // 1단계: 선호 근무 먼저 배정
      const assignedNurses = new Set<number>();
      currentNurses.forEach((nurse) => {
        const preference = nurse.preferences?.[day];
        if (preference && canWork(nurse.id, day, preference)) {
          newSchedule[day][nurse.id] = preference;
          const stats = nurseStats[nurse.id];
          stats.shifts[preference as keyof typeof stats.shifts]++;
          if (preference !== 'OFF') {
            stats.workDays++;
            stats.consecutiveWork++;
            if (preference === 'N') {
              stats.consecutiveNights++;
              stats.totalNights++;
            } else {
              stats.consecutiveNights = 0;
            }
          } else {
            stats.offDays++;
            stats.consecutiveWork = 0;
            stats.consecutiveNights = 0;
            if (stats.offCountAfterNight > 0) {
              stats.offCountAfterNight++;
              if (stats.offCountAfterNight >= 2) {
                stats.offCountAfterNight = 0;
              }
            }
          }
          stats.lastShift = preference;
          assignedNurses.add(nurse.id);
        } else if (preference === 'OFF') {
          newSchedule[day][nurse.id] = 'OFF';
          const stats = nurseStats[nurse.id];
          stats.shifts.OFF++;
          stats.offDays++;
          stats.consecutiveWork = 0;
          stats.consecutiveNights = 0;
          if (stats.offCountAfterNight > 0) {
            stats.offCountAfterNight++;
            if (stats.offCountAfterNight >= 2) {
              stats.offCountAfterNight = 0;
            }
          }
          stats.lastShift = 'OFF';
          assignedNurses.add(nurse.id);
        }
      });

      // 2단계: 나머지 자동 배정
      const remainingNurses = currentNurses.filter((n) => !assignedNurses.has(n.id));

      // 규칙 6: 데이 6명, 이브닝 6명, 나이트 4명
      const dailyShifts: string[] = [];

      // 데이 6명
      for (let i = 0; i < 6; i++) dailyShifts.push('D');
      // 이브닝 6명
      for (let i = 0; i < 6; i++) dailyShifts.push('E');
      // 나이트 4명
      for (let i = 0; i < 4; i++) dailyShifts.push('N');

      // 간호사 정렬에 랜덤성 추가
      const sortedNurses = [...remainingNurses].sort((a, b) => {
        const aStats = nurseStats[a.id];
        const bStats = nurseStats[b.id];

        if (aStats.offDays >= targetOffDays && bStats.offDays < targetOffDays) return -1;
        if (bStats.offDays >= targetOffDays && aStats.offDays < targetOffDays) return 1;

        const aWorkRatio = aStats.workDays / Math.max(day, 1);
        const bWorkRatio = bStats.workDays / Math.max(day, 1);
        const targetRatio = targetWorkDays / totalDays;

        const aDiff = Math.abs(aWorkRatio - targetRatio);
        const bDiff = Math.abs(bWorkRatio - targetRatio);

        if (Math.abs(aDiff - bDiff) < 0.1) {
          return Math.random() - 0.5;
        }

        return aDiff - bDiff;
      });

      // 근무 타입 순서를 랜덤하게 섞기
      const shiftTypesOrder = shuffle(['D', 'E', 'N']);

      // 각 근무 타입별로 배정
      for (let shiftType of shiftTypesOrder) {
        const neededCount = dailyShifts.filter((s) => s === shiftType).length;
        if (neededCount === 0) continue;

        const sortedForShift = [...sortedNurses]
          .filter((n) => !assignedNurses.has(n.id))
          .sort((a, b) => {
            const aShiftCount = nurseStats[a.id].shifts[shiftType as keyof (typeof nurseStats)[number]['shifts']];
            const bShiftCount = nurseStats[b.id].shifts[shiftType as keyof (typeof nurseStats)[number]['shifts']];

            if (Math.abs(aShiftCount - bShiftCount) <= 1) {
              return Math.random() - 0.5;
            }

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
      remainingNurses.forEach((nurse) => {
        if (!assignedNurses.has(nurse.id)) {
          const stats = nurseStats[nurse.id];

          // 나이트 다음날이면 무조건 OFF
          if (stats.lastShift === 'N' || stats.offCountAfterNight > 0) {
            newSchedule[day][nurse.id] = 'OFF';
            stats.shifts.OFF++;
            stats.offDays++;
            stats.consecutiveWork = 0;
            stats.consecutiveNights = 0;
            if (stats.offCountAfterNight > 0) {
              stats.offCountAfterNight++;
              if (stats.offCountAfterNight >= 2) {
                stats.offCountAfterNight = 0;
              }
            }
            stats.lastShift = 'OFF';
            return;
          }

          const daysPassed = day;
          const expectedOffByNow = (targetOffDays / totalDays) * daysPassed;
          const offDeficit = stats.offDays - expectedOffByNow;

          if (stats.offDays >= targetOffDays && offDeficit >= 0) {
            // 가장 적게 한 근무 타입 찾기 (단, E 다음 D는 금지)
            let leastShift: 'D' | 'E' | 'N' = 'D';
            let minCount = Infinity;

            for (let shift of ['D', 'E', 'N'] as const) {
              if (stats.lastShift === 'E' && shift === 'D') continue; // E 다음 D 금지
              if (shift === 'N' && stats.totalNights >= 3) continue; // 나이트 3회 제한
              if (stats.shifts[shift] < minCount) {
                minCount = stats.shifts[shift];
                leastShift = shift;
              }
            }

            newSchedule[day][nurse.id] = leastShift;
            stats.shifts[leastShift]++;
            stats.workDays++;
            stats.consecutiveWork++;
            if (leastShift === 'N') {
              stats.totalNights++;
              stats.offCountAfterNight = 1;
            }
            stats.lastShift = leastShift;
          } else {
            newSchedule[day][nurse.id] = 'OFF';
            stats.shifts.OFF++;
            stats.offDays++;
            stats.consecutiveWork = 0;
            stats.consecutiveNights = 0;
            if (stats.offCountAfterNight > 0) {
              stats.offCountAfterNight++;
              if (stats.offCountAfterNight >= 2) {
                stats.offCountAfterNight = 0;
              }
            }
            stats.lastShift = 'OFF';
          }
        }
      });
    }

    setSchedule(newSchedule);
    setIsGenerating(false);
  };

  // 통계 계산
  const calculateStats = () => {
    const currentNurses = getNurses();
    const stats: { [key: number]: { D: number; E: number; N: number; OFF: number; total: number } } = {};

    currentNurses.forEach((nurse) => {
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
  const displayNurses = getNurses();

  // 달력 이미지로 저장
  const downloadCalendar = (nurseId: number) => {
    const calendarElement = document.getElementById(`calendar-${nurseId}`);
    if (!calendarElement) return;

    // html2canvas 대신 직접 canvas로 그리기
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = 800;
    canvas.height = 600;

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 제목
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px Pretendard, sans-serif';
    const currentNurses = getNurses();
    const nurse = currentNurses.find((n) => n.id === nurseId);
    ctx.fillText(`${nurse?.name} - ${currentMonth} 근무표`, 40, 50);

    // 달력 그리기
    const days = getDaysInMonth(currentMonth);
    const cellWidth = 100;
    const cellHeight = 80;
    const startX = 40;
    const startY = 100;
    const cols = 7;

    days.forEach((day, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * cellWidth;
      const y = startY + row * cellHeight;

      const shift = schedule[day]?.[nurseId] || '-';
      const shiftInfo = shiftTypes[shift as keyof ShiftTypes];
      const dayOfWeek = getDayOfWeek(currentMonth, day);

      // 셀 배경
      ctx.fillStyle = shiftInfo?.color || '#E5E7EB';
      ctx.fillRect(x, y, cellWidth - 5, cellHeight - 5);

      // 날짜
      ctx.fillStyle = shift === '-' ? '#6B7280' : '#ffffff';
      ctx.font = 'bold 16px Pretendard, sans-serif';
      ctx.fillText(`${day}일`, x + 10, y + 25);

      // 요일
      ctx.font = '12px Pretendard, sans-serif';
      ctx.fillText(dayOfWeek, x + 10, y + 45);

      // 근무 타입
      ctx.font = 'bold 20px Pretendard, sans-serif';
      ctx.fillText(shift, x + 10, y + 70);
    });

    // 다운로드
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nurse?.name}_${currentMonth}_근무표.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  // 달력 뷰 렌더링
  const renderCalendarView = (nurseId: number) => {
    const currentNurses = getNurses();
    const nurse = currentNurses.find((n) => n.id === nurseId);
    if (!nurse) return null;

    const days = getDaysInMonth(currentMonth);
    const [year, month] = currentMonth.split('-');

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto',
        }}
        onClick={() => setSelectedNurseForCalendar(null)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', margin: 0 }}>
                {nurse.name}의 근무표
              </h2>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                {year}년 {month}월
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => downloadCalendar(nurseId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '14px',
                }}
              >
                📥 이미지 저장
              </button>
              <button
                onClick={() => setSelectedNurseForCalendar(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '14px',
                }}
              >
                ✕ 닫기
              </button>
            </div>
          </div>

          {/* 달력 */}
          <div id={`calendar-${nurseId}`} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: '8px',
              }}
            >
              {days.map((day) => {
                const shift = schedule[day]?.[nurseId] || '-';
                const shiftInfo = shiftTypes[shift as keyof ShiftTypes];
                const dayOfWeek = getDayOfWeek(currentMonth, day);
                const isWeekendDay = isWeekend(currentMonth, day);

                return (
                  <div
                    key={day}
                    style={{
                      backgroundColor: shiftInfo?.color || '#E5E7EB',
                      color: shift === '-' ? '#6B7280' : 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: isWeekendDay ? '3px solid #ef4444' : 'none',
                      minHeight: '90px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{day}일</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>{dayOfWeek}</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>{shift}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 통계 */}
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', margin: '0 0 12px 0' }}>
              이번 달 통계
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                gap: '12px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7B9FE8' }}>{stats[nurseId]?.D || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>데이</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B865D6' }}>{stats[nurseId]?.E || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>이브닝</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A5568' }}>{stats[nurseId]?.N || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>나이트</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E8A577' }}>{stats[nurseId]?.OFF || 0}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>휴무</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {stats[nurseId]?.total || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>총 근무</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ minWidth: 'auto', width: '100%' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
              <select
                value={numNurses}
                onChange={(e) => setNumNurses(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                  <option key={num} value={num}>
                    {num}명
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>최소 10명 (D6+E6+N4 교대)</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                1인당 OFF 일수
              </label>
              <select
                value={offDaysPerNurse}
                onChange={(e) => setOffDaysPerNurse(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                  <option key={num} value={num}>
                    {num}일
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>권장: 12일 (근무 19일)</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={generateSchedule}
                disabled={isGenerating}
                style={{
                  marginBottom: '16px',
                  width: '100%',
                  padding: '10px 24px',
                  backgroundColor: isGenerating ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'all 0.3s',
                }}
                onMouseOver={(e) => {
                  if (!isGenerating) e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  if (!isGenerating) e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                <RotateCw
                  size={20}
                  className={isGenerating ? 'animate-spin' : ''}
                  style={isGenerating ? { animation: 'spin 1s linear infinite' } : {}}
                />
                {isGenerating ? '생성 중...' : '스케줄 생성'}
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

          {/* 간호사 이름 입력 */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              간호사 이름 및 경력 설정
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nurses.map((nurse) => (
                <div key={nurse.id} style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      이름
                    </label>
                    <input
                      type="text"
                      value={nurse.name}
                      onChange={(e) => updateNurseName(nurse.id, e.target.value)}
                      placeholder={`간호사${nurse.id}`}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div style={{ width: '80px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      경력(년)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={nurse.experience}
                      onChange={(e) => updateNurseExperience(nurse.id, parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280',
                padding: '8px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
              }}
            >
              💡 경력: 5년 이상 = 고연차(총괄), 3-4년 = 중견, 1-2년 = 신입. 각 듀티에 고연차 1명 이상 자동 배치됩니다.
            </div>
          </div>

          {/* 선호 근무 설정 */}
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
              💡 선호 근무 설정 (선택사항)
            </h3>
            <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '12px' }}>
              특정 날짜에 원하는 근무를 설정하세요. 스케줄 생성 시 우선 반영됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nurses.map((nurse) => (
                <div
                  key={nurse.id}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                    {nurse.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min="1"
                      max={getDaysInMonth(currentMonth).length}
                      placeholder="날짜"
                      id={`day-${nurse.id}`}
                      style={{
                        width: '60px',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>일</span>
                    <select
                      id={`shift-${nurse.id}`}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                        flex: 1,
                        minWidth: '80px',
                      }}
                    >
                      <option value="">선택</option>
                      <option value="D">D (데이)</option>
                      <option value="E">E (이브닝)</option>
                      <option value="N">N (나이트)</option>
                      <option value="OFF">OFF (휴무)</option>
                    </select>
                    <button
                      onClick={() => {
                        const dayInput = document.getElementById(`day-${nurse.id}`) as HTMLInputElement;
                        const shiftSelect = document.getElementById(`shift-${nurse.id}`) as HTMLSelectElement;
                        const day = parseInt(dayInput.value);
                        const shift = shiftSelect.value;
                        if (day && shift) {
                          updateNursePreference(nurse.id, day, shift);
                          dayInput.value = '';
                          shiftSelect.value = '';
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      추가
                    </button>
                  </div>
                  {/* 설정된 선호 근무 표시 */}
                  {nurse.preferences && Object.keys(nurse.preferences).length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {Object.entries(nurse.preferences).map(([day, shift]) => (
                        <span
                          key={day}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {day}일: {shift}
                          <button
                            onClick={() => updateNursePreference(nurse.id, parseInt(day), '')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1e40af',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '14px',
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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
                      marginBottom: '12px',
                    }}
                  >
                    <span>근무:</span>
                    <span>{stats[nurse.id]?.total || 0}</span>
                  </div>
                  <button
                    onClick={() => setSelectedNurseForCalendar(nurse.id)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    📅 달력 보기
                  </button>
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
                    {displayNurses.map((nurse) => (
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
                        {displayNurses.map((nurse) => {
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
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6"
          style={{ padding: '24px', margin: '24px 0 0 0' }}
        >
          <h3 className="font-semibold text-blue-900 mb-3 text-base" style={{ marginBottom: '12px' }}>
            🤖 자동 생성 규칙
          </h3>
          <ul className="text-sm text-blue-800 space-y-2" style={{ fontSize: '14px', color: '#1e40af' }}>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>인력 배치:</strong> 데이 6명, 이브닝 6명, 나이트 4명
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>금지 패턴:</strong> N→OFF→D 불가, E→D 불가
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>연속 근무:</strong> 최대 5일까지만 허용
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>나이트 규칙:</strong> N 후 OFF 2일 필수, 월 최대 3회
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>총괄 배치:</strong> 각 듀티에 고연차(5년+) 1명 이상 필수
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>OFF 배분:</strong> 각 간호사별로 균등하게 배분 (기본 12일)
            </li>
            <li style={{ marginBottom: '8px' }}>
              ✓ <strong>선호 반영:</strong> 설정한 선호 근무 우선 배정
            </li>
            <li style={{ marginBottom: 0 }}>
              ✓ <strong>주말 표시:</strong> 빨간색 배경으로 표시
            </li>
          </ul>
        </div>

        {/* 달력 팝업 */}
        {selectedNurseForCalendar !== null && renderCalendarView(selectedNurseForCalendar)}
      </div>
    </div>
  );
};

export default NurseScheduleApp;
