export interface LocationInfo {
  id: string;
  address: string;
  placeName: string;
}

export interface PlaceSearchResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  distance: string;
  category_name: string;
  phone?: string;
  place_url?: string;
  category_group_code?: string;
  category_group_name?: string;
}

export interface GeocoderResult {
  y: string;
  x: string;
}
