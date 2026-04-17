import axios from 'axios';

export const ausTempUrl = (date: string) =>
  `https://imos-data.s3.ap-southeast-2.amazonaws.com/IMOS/SRS/AusTemp/Marine-Heatwave/${date.slice(0, 4)}/${date}_IMOS_AusTemp-marine-heatwave_AUS_fv02.nc`;
export const gslaUrl = (date: string) => [
  `https://imos-data.s3.ap-southeast-2.amazonaws.com/IMOS/OceanCurrent/GSLA/NRT/${date.slice(0, 4)}/IMOS_OceanCurrent_HV_${date}T180000Z_GSLA_FV02_NRT.nc`,
  `https://imos-data.s3.ap-southeast-2.amazonaws.com/IMOS/OceanCurrent/GSLA/NRT/${date.slice(0, 4)}/IMOS_OceanCurrent_HV_${date}T000000Z_GSLA_FV02_NRT.nc`,
];

export async function fileExist(url: string | string[], date: string): Promise<string | null> {
  const urls = Array.isArray(url) ? url : [url];

  const checks = urls.map(async u => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    try {
      await axios.head(u, { signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  });

  try {
    await Promise.any(checks);
    return date;
  } catch {
    return null;
  }
}
