import {
  MapComponent,
  FloatingPanel,
  Sidebar,
  MapControlPanel,
  MainSidebarContent,
  FeaturesMenu,
  LayersIcon,
  MapsIcon,
  MeasuresIcon,
  DateSelectionBar,
} from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import { useZustandUrlSync } from '@/hooks';
import { useShallow } from 'zustand/shallow';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { overlay, particles, circle, dataset, setOverlay, setCircle, setParticles, setDataset } =
    useMapUIStore(
      useShallow(s => ({
        overlay: s.overlay,
        particles: s.particles,
        circle: s.circle,
        dataset: s.dataset,
        setOverlay: s.setOverlay,
        setCircle: s.setCircle,
        setParticles: s.setParticles,
        setDataset: s.setDataset,
      })),
    );

  useZustandUrlSync({
    keys: ['overlay', 'particles', 'circle', 'dataset'],
    getState: () => ({
      overlay: overlay,
      particles: particles,
      circle: circle,
      dataset: dataset,
    }),
    setState: (key, value) => {
      switch (key) {
        case 'overlay':
          setOverlay(value);
          break;
        case 'particles':
          setParticles(value);
          break;
        case 'circle':
          setCircle(value);
          break;
        case 'dataset':
          {
            console.log(value, 'from map');
            setDataset(value);
          }
          break;
        default:
          break;
      }
    },
  });

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="overflow-hidden h-screen w-full">
      <Sidebar width={540} defaultOpen={true} sidebarContent={<MainSidebarContent />}>
        <>
          <div className="h-full w-full relative">
            <MapComponent ref={mapRef} />
            <MapControlPanel ref={mapRef} className="absolute top-16 left-4 z-10" />
            <DateSelectionBar className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-full" />
          </div>

          <FloatingPanel
            boundary="parent"
            collapsible
            children={
              <FeaturesMenu
                features={[
                  { icon: LayersIcon, label: 'Layers' },
                  { icon: MapsIcon, label: 'Maps' },
                  { icon: MeasuresIcon, label: 'Measurement' },
                ]}
              />
            }
            initialPosition={{ x: 10, y: 20 }}
          />
        </>
      </Sidebar>
    </div>
  );
};
