// 공통 API 설정 및 유틸리티

// API 기본 설정
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'; // 로컬 개발 환경

// API 응답 타입
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// API 에러 타입
export interface ApiError {
    message: string;
    status: number;
    code?: string;
}

// 기본 헤더 생성
export const getDefaultHeaders = (): Record<string, string> => {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

// 인증 헤더 생성
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers = getDefaultHeaders();

    // 실제로는 AsyncStorage나 다른 저장소에서 토큰을 가져옴
    // const token = await AsyncStorage.getItem('accessToken');
    const token = ''; // 임시로 빈 문자열

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

// API 요청 래퍼 함수
export const apiRequest = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const fullUrl = `${API_BASE_URL}${url}`;

    const headers = await getAuthHeaders();

    const config: RequestInit = {
        headers: {
            ...headers,
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(fullUrl, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('API 요청 실패:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

// GET 요청
export const apiGet = <T>(url: string): Promise<T> => {
    return apiRequest<T>(url, { method: 'GET' });
};

// POST 요청
export const apiPost = <T>(url: string, data?: any): Promise<T> => {
    return apiRequest<T>(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
};

// PUT 요청
export const apiPut = <T>(url: string, data?: any): Promise<T> => {
    return apiRequest<T>(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
};

// DELETE 요청
export const apiDelete = <T>(url: string): Promise<T> => {
    return apiRequest<T>(url, { method: 'DELETE' });
};

// 파일 업로드 요청
export const apiUpload = async <T>(
    url: string,
    formData: FormData
): Promise<T> => {
    const headers = await getAuthHeaders();
    delete headers['Content-Type']; // FormData는 자동으로 설정됨

    return apiRequest<T>(url, {
        method: 'POST',
        headers,
        body: formData,
    });
}; 