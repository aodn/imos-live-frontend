import "./App.css";
import { useState } from "react";
import { getLast7DatesEnding3DaysAgo } from "./utils/getLast7DaysEnding3DaysAgo";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapComponent, MenuComponent } from "./components";
import { useMemo, useCallback } from "react";

const datasets = getLast7DatesEnding3DaysAgo();

function App() {
  const [style, setStyle] = useState("Dark");
  const [overlay, setOverlay] = useState(false);
  const [particles, setParticles] = useState(true);
  const [numParticles, setNumParticles] = useState(10000);
  const [dataset, setDataset] = useState(datasets.at(-1));

  const handleSetStyle = useCallback((style: string) => {
    setStyle(style);
  }, []);

  const handleSetOverlay = useCallback((v: boolean) => {
    setOverlay(v);
  }, []);

  const handleSetParticles = useCallback((v: boolean) => {
    setParticles(v);
  }, []);

  const handleSetNumParticles = useCallback((numParticles: number) => {
    setNumParticles(numParticles);
  }, []);

  const handleSetDataset = useCallback((dataset: string) => {
    setDataset(dataset);
  }, []);

  const menuProps = useMemo(
    () => ({
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
    }),
    [
      dataset,
      handleSetDataset,
      handleSetNumParticles,
      handleSetOverlay,
      handleSetParticles,
      handleSetStyle,
      numParticles,
      overlay,
      particles,
      style,
    ],
  );

  const mapProps = useMemo(
    () => ({
      style,
      overlay,
      particles,
      numParticles,
      dataset,
      datasets,
    }),
    [dataset, numParticles, overlay, particles, style],
  );

  return (
    <div className="App">
      <MapComponent {...mapProps} />
      <MenuComponent {...menuProps} />
    </div>
  );
}
export default App;
