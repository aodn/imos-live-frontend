import { Search } from './Search';
import { Header } from './Header';
import { ImageType } from '@/types';
import { LayerProducts } from './LayerProducts';
import { cn } from '@/lib/utils';
import { LayerSets } from './LayerSets';
import { headderDataMock, layerProductsMock, featuredDatasetMock } from './mock';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { useMemo } from 'react';
import { normalizeLayerSets } from '@/utils';

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
  const { overlay, particles, circle, displayOverlay, displayCircle, displayParticles } =
    useMapUIStore(
      useShallow(s => ({
        overlay: s.overlay,
        particles: s.particles,
        circle: s.circle,
        displayOverlay: s.setOverlay,
        displayCircle: s.setCircle,
        displayParticles: s.setParticles,
      })),
    );
  const normalizedLayerSets = useMemo(() => {
    return normalizeLayerSets(
      featuredDatasetMock.map(item => ({ ...item })),
      {
        displayCircle,
        displayOverlay,
        displayParticles,
      },
      {
        particles,
        overlay,
        circle,
      },
    );
  }, [displayCircle, displayOverlay, displayParticles, particles, overlay, circle]);
  return (
    <div className={cn('h-full', className)}>
      <Header image={headderDataMock.image} title={headderDataMock.title} />

      <Search className="mt-4 px-2" />

      <LayerSets
        title="Featured Functions"
        layersDatasets={normalizedLayerSets}
        className="px-2 mt-4"
      />

      <LayerProducts products={layerProductsMock} title="OC Products" className="mt-4 px-8" />
    </div>
  );
};
