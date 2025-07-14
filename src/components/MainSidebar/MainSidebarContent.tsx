import { Search } from './Search';
import { Header } from './Header';
import { ImageType } from '@/types';
import { LayerProducts } from './LayerProducts';
import { LayerSets } from './LayerSets';
import { headerData, layerProductsMock, featuredDataset } from './products';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { ReactNode, useMemo, useState } from 'react';
import { cn, normalizeLayerSets } from '@/utils';

export type HeaderData = {
  image: ImageType;
  title: string;
};
export type LayersDataset = {
  image: ImageType;
  title: string;
  icon: ReactNode;
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
  const [searchQuery, setSearchQuery] = useState('');

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
      featuredDataset.map(item => ({ ...item })),
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

  const filteredLayerSets = useMemo(() => {
    return normalizedLayerSets.filter(layerSet =>
      layerSet.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [normalizedLayerSets, searchQuery]);

  return (
    <div className={cn('h-full pb-4', className)}>
      <Header className="hidden md:flex" image={headerData.image} title={headerData.title} />

      <Search className="mt-4 md:px-2" fn={s => setSearchQuery(s)} />

      <LayerSets
        title="Featured Functions"
        layersDatasets={filteredLayerSets}
        className="md:px-2 mt-4"
      />

      <LayerProducts
        products={layerProductsMock}
        title="OC Products"
        className="mt-4 md:px-8 hidden"
      />
    </div>
  );
};
