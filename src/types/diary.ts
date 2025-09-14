export interface DiaryMonthOverviewResponse {
  title: string;
  startDate: string;
  endDate: string;
  mainStickerUrl: string;
}

export interface DiaryMonthOverviewRequest {
  startDate: string;
  endDate: string;
}

export interface DiaryMonthOverviewApiResponse {
  diaryMonthOverviewResponses: DiaryMonthOverviewResponse[];
}
