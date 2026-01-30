import axios from 'axios';

export const sstaUrl = (date: string) =>
  `https://imos-data.s3.ap-southeast-2.amazonaws.com/IMOS/SRS/AusTemp/ssta/${date.slice(0, 4)}/${date}_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc`;
export const gslaUrl = (date: string) =>
  `https://imos-data.s3.ap-southeast-2.amazonaws.com/IMOS/OceanCurrent/GSLA/NRT/${date.slice(0, 4)}/IMOS_OceanCurrent_HV_${date}T180000Z_GSLA_FV02_NRT.nc`;

export async function fileExist(url: string, date: string): Promise<string | undefined> {
  const response = await axios.head(url, {
    timeout: 3000,
    //by default, validateStatus = status => status >= 200 && status < 300, so any other status will throw exception.
  });
  if (response.status >= 200 && response.status < 300) {
    return date;
  }
}
