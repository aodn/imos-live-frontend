import { Layer } from "mapbox-gl";

export const circleLayer = (
  id: string,
  source: string,
  visible: boolean,
): Layer => ({
  id,
  source,
  type: "circle",
  layout: {
    visibility: visible ? "visible" : "none",
  },
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["coalesce", ["get", "significant_wave_height"], 0],
      0,
      4,
      2,
      12,
      4,
      20,
    ],
    "circle-color": "#007cbf",
  },
});
