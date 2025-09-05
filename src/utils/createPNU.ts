// Kakao Local(주소) API 응답 최소 타입
export interface KakaoAddressDocument {
  address?: {
    b_code: string; // 법정동코드(10자리)
    mountain_yn: 'Y' | 'N';
    main_address_no: string | number;
    sub_address_no?: string | number;
  };
  road_address?: {
    address_name: string;
    b_code?: string;
  };
}

export interface KakaoAddressSearchResponse {
  documents: KakaoAddressDocument[];
}

// parts → PNU 조립
export function buildPnuFromParts(params: {
  bCode10: string;
  mountainYn: 'Y' | 'N';
  mainNo: string | number;
  subNo?: string | number;
}): string | null {
  const { bCode10, mountainYn, mainNo, subNo } = params;
  if (!bCode10 || bCode10.length < 10) return null;
  const sigungu = bCode10.slice(0, 5);
  const beopjeong = bCode10.slice(5, 10);
  const mountain = mountainYn === 'Y' ? '1' : '0';
  const mainPadded = String(mainNo ?? 0).padStart(4, '0');
  const subPadded = String(subNo ?? 0).padStart(4, '0');
  return `${sigungu}${beopjeong}${mountain}${mainPadded}${subPadded}`;
}

// Kakao 문서 → PNU 추출
export function buildPnuFromKakaoDoc(doc: KakaoAddressDocument): string | null {
  const a = doc.address;
  if (!a) return null;
  return buildPnuFromParts({
    bCode10: a.b_code,
    mountainYn: a.mountain_yn,
    mainNo: a.main_address_no,
    subNo: a.sub_address_no,
  });
}

// 주소 문자열 → PNU (Kakao 주소검색 호출)
// env: NEXT_PUBLIC_KAKAO_REST_API_KEY 또는 KAKAO_REST_API_KEY
export async function addressToPnu(query: string): Promise<string | null> {
  const apiKey =
    process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as KakaoAddressSearchResponse;
  if (!data.documents?.length) return null;

  // 1순위: 지번 address가 있는 문서
  const docWithAddress = data.documents.find((d) => d.address);
  if (docWithAddress) return buildPnuFromKakaoDoc(docWithAddress);

  // 2순위: road_address만 있을 경우 road_address.address_name으로 재조회
  const road = data.documents[0]?.road_address?.address_name;
  if (road) {
    const again = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
        road
      )}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` }, cache: 'no-store' }
    );
    if (!again.ok) return null;
    const againData = (await again.json()) as KakaoAddressSearchResponse;
    const againDoc = againData.documents.find((d) => d.address);
    if (againDoc) return buildPnuFromKakaoDoc(againDoc);
  }
  return null;
}


