/**
 * 연인 시작일로부터 현재까지의 일수를 계산하는 유틸리티
 * @param startDate - 연인 시작일 (YYYY-MM-DD 형식)
 * @returns 현재까지의 일수 (D+숫자)
 */
export function calculateRelationshipDays(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  
  // 시간을 00:00:00으로 설정하여 날짜만 비교
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // 밀리초 차이를 일수로 변환
  const timeDiff = today.getTime() - start.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff + 1; // 시작일을 1일로 계산
}

/**
 * 디데이 표시 텍스트를 생성하는 함수
 * @param startDate - 연인 시작일 (YYYY-MM-DD 형식)
 * @returns 디데이 표시 텍스트 (예: "D+365")
 */
export function getRelationshipDaysText(startDate: string): string {
  const days = calculateRelationshipDays(startDate);
  return `D+${days}`;
}
