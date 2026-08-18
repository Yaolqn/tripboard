export interface Place {
  id: string;
  name: string;
  address: string;
  location: string;
  type?: string;
  tel?: string;
  city?: string;
  district?: string;
}

export interface PlaceSearchResponse {
  places: Place[];
  configured: boolean;
}
