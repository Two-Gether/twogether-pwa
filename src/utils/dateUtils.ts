/**
 * 두 날짜 사이의 일수 차이를 계산합니다
 * @param startDate 시작 날짜 (YYYY-MM-DD 형식)
 * @param endDate 종료 날짜 (YYYY-MM-DD 형식, 기본값: 오늘)
 * @returns 일수 차이 (양수: 미래, 음수: 과거)
 */
export function getDaysDifference(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  // 시간을 00:00:00으로 설정하여 날짜만 비교
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - end.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 현재 월의 첫째 날과 마지막 날을 반환합니다
 * @param date 기준 날짜 (기본값: 오늘)
 * @returns { startDate: "YYYY-MM-01", endDate: "YYYY-MM-DD" }
 */
export function getCurrentMonthRange(date?: Date): { startDate: string; endDate: string } {
  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // 다음 달의 0일 = 이번 달의 마지막 날
  
  console.log('🔍 dateUtils - 현재 날짜:', targetDate);
  console.log('🔍 dateUtils - 계산된 년월:', year, month + 1);
  console.log('🔍 dateUtils - 시작일:', formatDate(startDate));
  console.log('🔍 dateUtils - 종료일:', formatDate(endDate));
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다
 * @param date Date 객체
 * @returns "YYYY-MM-DD" 형식의 문자열
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 형식의 날짜를 한국어 형식으로 변환합니다
 * @param dateString "YYYY-MM-DD" 형식의 날짜 문자열
 * @returns "2025/03/18(목)" 형식의 문자열
 */
export function formatDateToKorean(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  
  return `${year}/${month}/${day}(${weekday})`;
}
