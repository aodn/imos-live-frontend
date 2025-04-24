import "./App.css";
import { getLast7DatesEnding3DaysAgo } from "@/utils";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapComponent, MenuComponent } from "@/components";
import { useState } from "react";

const datasets = getLast7DatesEnding3DaysAgo();

function App() {
  const [style, setStyle] = useState("Dark");
  const [overlay, setOverlay] = useState(false);
  const [particles, setParticles] = useState(true);
  const [numParticles, setNumParticles] = useState(10000);
  const [dataset, setDataset] = useState<string>(datasets.at(-1)!);

  const handleSetStyle = (style: string) => {
    setStyle(style);
  };

  const handleSetOverlay = (v: boolean) => {
    setOverlay(v);
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
    particles,
    numParticles,
    dataset,
    datasets,
    handleSetStyle,
    handleSetOverlay,
    handleSetParticles,
    handleSetNumParticles,
    handleSetDataset,
  };

  const mapProps = {
    style,
    overlay,
    particles,
    numParticles,
    dataset,
    datasets,
  };

  return (
    <div className="App">
      <MapComponent {...mapProps} />
      <MenuComponent {...menuProps} />
    </div>
  );
}
export default App;
