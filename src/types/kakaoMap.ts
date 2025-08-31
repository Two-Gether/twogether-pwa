export interface PlaceSearchResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  distance: string;
  category_name: string;
}

export interface PlaceInfo {
  name: string;
  address: string;
  category: string;
  details: {
    phone?: string;
    url?: string;
    road_address?: string;
  };
}
