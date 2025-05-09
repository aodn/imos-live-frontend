import { useState } from "react";
import { StyleTitle } from "@/styles";
import { MapComponent, MenuComponent } from "@/components";
import { getLast7DatesEnding3DaysAgo } from "@/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const datasets = getLast7DatesEnding3DaysAgo();

export const Map = () => {
  const [style, setStyle] = useState<StyleTitle>("Dark");
  const [overlay, setOverlay] = useState(false);
  const [circle, setCircle] = useState(false);
  const [particles, setParticles] = useState(true);
  const [numParticles, setNumParticles] = useState(10000);
  const [dataset, setDataset] = useState<string>(datasets.at(-1)!);

  const handleSetStyle = (style: string) => {
    setStyle(style);
  };

  const handleSetOverlay = (v: boolean) => {
    setOverlay(v);
  };
  const handleSetCircle = (v: boolean) => {
    setCircle(v);
  };
  const handleSetParticles = (v: boolean) => {
    setParticles(v);
  };

  const handleSetNumParticles = (numParticles: number) => {
    setNumParticles(numParticles);
  };

  const handleSetDataset = (dataset: string) => {
    setDataset(dataset);
  };

  const menuProps = {
    style,
    overlay,
    circle,
    particles,
    numParticles,
    dataset,
    datasets,
    handleSetStyle,
    handleSetOverlay,
    handleSetCircle,
    handleSetParticles,
    handleSetNumParticles,
    handleSetDataset,
  };

  const mapProps = {
    style,
    overlay,
    circle,
    particles,
    numParticles,
    dataset,
    datasets,
  };

  return (
    <div className="h-screen w-screen">
      <MapComponent {...mapProps} />
      <MenuComponent {...menuProps} />
    </div>
  );
};
