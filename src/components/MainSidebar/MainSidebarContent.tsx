import { Search } from './Search';
import { Header } from './Header';
import { ImageType } from '@/types';
import { LayerProducts } from './LayerProducts';
import { LayerSets } from './LayerSets';
import { headderDataMock, layerProductsMock, featuredDatasetMock } from './mock';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { useMemo } from 'react';
import { cn, normalizeLayerSets } from '@/utils';

export type HeaderData = {
  image: ImageType;
  title: string;
};
export type LayersDataset = {
  image: ImageType;
  title: string;
  description: string;
  addToMap: (v: boolean) => void;
  layerId: string;
  visible: boolean;
};

export type LayerProducts = {
  label: string;
  Icon?: React.ComponentType<any>;
  fn?: () => void;
}[];

type MainSidebarProps = {
  className?: string;
};

export const MainSidebarContent: React.FC<MainSidebarProps> = ({ className = '' }) => {
  const { overlay, particles, circle, setOverlay, setCircle, setParticles } = useMapUIStore(
    useShallow(s => ({
      overlay: s.overlay,
      particles: s.particles,
      circle: s.circle,
      setOverlay: s.setOverlay,
      setCircle: s.setCircle,
      setParticles: s.setParticles,
    })),
  );
  const normalizedLayerSets = useMemo(() => {
    return normalizeLayerSets(
      featuredDatasetMock.map(item => ({ ...item })),
      {
        setCircle,
        setOverlay,
        setParticles,
      },
      {
        particles,
        overlay,
        circle,
      },
    );
  }, [setCircle, setOverlay, setParticles, particles, overlay, circle]);
  return (
    <div className={cn('h-full', className)}>
      <Header
        className="hidden md:flex"
        image={headderDataMock.image}
        title={headderDataMock.title}
      />

      <Search className="mt-4 md:px-2" />

      <LayerSets
        title="Featured Functions"
        layersDatasets={normalizedLayerSets}
        className="md:px-2 mt-4"
      />

      <LayerProducts products={layerProductsMock} title="OC Products" className="mt-4  md:px-8" />
    </div>
  );
};
