import { getAuthToken } from '@/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export interface Waypoint {
  waypointId: number;
  name: string;
  itemCount: number;
}

export interface WaypointDetail {
  waypointId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaypointItem {
  itemId: number;
  waypointId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaypointRequest {
  name: string;
}

export interface CreateWaypointItemRequest {
  name: string;
  description?: string;
  order: number;
}

export interface DeleteWaypointItemsRequest {
  waypointItemIds: number[];
}

export interface UpdateWaypointItemsOrderRequest {
  orderedIds: number[];
}

export interface WaypointListResponse {
  waypointSummaryResponses: Array<{
    waypointId: number;
    name: string;
    itemCount: number;
  }>;
}

export interface CreateWaypointResponse {
  waypointId: string;
  name: string;
}

export interface ApiResponse {
  success: boolean;
  [key: string]: unknown;
}

// 웨이포인트 목록 조회
export const getWaypoints = async (): Promise<WaypointListResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('웨이포인트 목록 조회에 실패했습니다.');
  }

  return response.json();
};

// 웨이포인트 생성
export const createWaypoint = async (data: CreateWaypointRequest): Promise<CreateWaypointResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('웨이포인트 생성에 실패했습니다.');
  }

  return response.json();
};

// 웨이포인트 상세 조회
export const getWaypoint = async (waypointId: number): Promise<WaypointDetail> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint/${waypointId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('웨이포인트 조회에 실패했습니다.');
  }

  return response.json();
};

// 웨이포인트 삭제
export const deleteWaypoint = async (waypointId: number): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint/${waypointId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('웨이포인트 삭제에 실패했습니다.');
  }
};

// 웨이포인트 아이템 생성
export const createWaypointItem = async (waypointId: number, data: CreateWaypointItemRequest): Promise<WaypointItem> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint/${waypointId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('웨이포인트 아이템 생성에 실패했습니다.');
  }

  return response.json();
};

// 웨이포인트 아이템 삭제
export const deleteWaypointItems = async (waypointId: number, data: DeleteWaypointItemsRequest): Promise<ApiResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint/${waypointId}/items`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('웨이포인트 아이템 삭제에 실패했습니다.');
  }

  const responseText = await response.text();
  return responseText.trim() ? JSON.parse(responseText) : { success: true };
};

// 웨이포인트 아이템 순서 변경
export const updateWaypointItemsOrder = async (waypointId: number, data: UpdateWaypointItemsOrderRequest): Promise<ApiResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/waypoint/${waypointId}/items`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('웨이포인트 아이템 순서 변경에 실패했습니다.');
  }

  const responseText = await response.text();
  return responseText.trim() ? JSON.parse(responseText) : { success: true };
};
