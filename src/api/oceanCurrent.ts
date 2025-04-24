import api from "./instance";

export interface OceanCurrentResponse {
  u: number;
  v: number;
  alpha: boolean;
  speed: number;
  speedUnit: string;
  degree: number;
  direction: string;
}

export const getOceanCurrentDetails = async (
  date: string,
  lat: number,
  lon: number,
): Promise<OceanCurrentResponse> => {
  const response = await api.get<OceanCurrentResponse>(
    `/dataset/ocean-current/${date}`,
    {
      params: { lat, lon },
    },
  );
  return response.data;
};
