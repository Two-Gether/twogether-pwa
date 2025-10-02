
interface KakaoMapSDK {
  maps: {
    Map: new (container: HTMLElement, options: { center: { lat: number; lng: number }; level: number }) => {
      setCenter: (position: { lat: number; lng: number }) => void;
      setLevel: (level: number) => void;
    };
    Marker: new (options: { position: { lat: number; lng: number }; map?: unknown }) => {
      setMap: (map: unknown) => void;
      setPosition: (position: { lat: number; lng: number }) => void;
    };
    LatLng: new (lat: number, lng: number) => { lat: number; lng: number };
    InfoWindow: new (options: { content: string }) => {
      open: (map: unknown, marker: unknown) => void;
      close: () => void;
      setContent: (content: string) => void;
    };
    event: {
      addListener: (target: unknown, type: string, handler: (event: { latLng: { getLat: () => number; getLng: () => number } }) => void) => void;
    };
    load: (callback: () => void) => void;
    services: {
      Places: new () => {
        keywordSearch: (keyword: string, callback: (result: unknown[], status: string) => void, options?: { page?: number; size?: number; location?: unknown }) => void;
      };
      Geocoder: new () => {
        coord2Address: (coord: unknown, callback: (result: unknown[], status: string) => void) => void;
        addressSearch: (address: string, callback: (result: unknown[], status: string) => void) => void;
      };
      Status: {
        OK: string;
        ZERO_RESULT: string;
        ERROR: string;
      };
    };
  };
}

declare global {
  interface Window {
    kakao: KakaoMapSDK;
  }
}

export {};
