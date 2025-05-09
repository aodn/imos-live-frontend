import type { VectorFieldAPI } from "@/types";
import VectorField from "../utils/VectorField";

type MetaData =
  | {
      bounds: [number, number, number, number];
      range: number[][];
    }
  | undefined;

export interface VectoryLayerInterface extends mapboxgl.CustomLayerInterface {
  sourceId: string;
  visible: boolean;
  metadata: MetaData;
  vectorField?: VectorFieldAPI;
  setData: (data: ImageBitmap) => void;
  setVisible: (visible: boolean) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onResize: () => void;
}

export const vectorLayer = (
  id: string,
  sourceId: string,
  visible: boolean,
): VectoryLayerInterface => ({
  id,
  sourceId,
  visible,
  metadata: undefined,
  vectorField: undefined, // Initialize vectorField

  onAdd: async function (map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.vectorField =
      this.vectorField === undefined ? VectorField(map, gl) : this.vectorField;

    map.on("sourcedata", (e) => {
      if (e?.sourceId !== this.sourceId || !e?.isSourceLoaded) return;

      const source = map.getSource(this.sourceId);
      if (!source) return;

      if ("image" in source && source.image instanceof ImageBitmap) {
        this.setData(source.image);
      }
    });

    map.on("movestart", () => {
      this.onMoveStart();
    });

    map.on("moveend", () => {
      this.onMoveEnd();
    });

    map.on("resize", () => {
      this.onResize();
    });
  },

  render: function () {
    this.vectorField?.draw();
  },

  onMoveStart: function () {
    if (this.visible && this.vectorField) {
      this.vectorField.stopAnimation();
    }
  },

  onMoveEnd: function () {
    if (this.visible && this.vectorField) {
      this.vectorField.startAnimation();
    }
  },

  onResize: function () {
    this.vectorField?.resize();
  },

  setData: function (data) {
    this.vectorField?.setData({
      data,
      bounds: this.metadata?.bounds ?? [0, 0, 0, 0],
      range: this.metadata?.range ?? [
        [0, 0],
        [0, 0],
      ],
    });
    if (this.visible && this.vectorField) {
      this.vectorField.startAnimation();
    }
  },

  setVisible: function (visible) {
    this.visible = visible;
    if (this.visible) {
      this.vectorField?.startAnimation();
    } else {
      this.vectorField?.stopAnimation();
    }
  },
  type: "custom",
});
