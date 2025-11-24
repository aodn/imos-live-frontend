import { Header } from './Header';
import { ImageType } from '@/types';
import { LayerProducts } from './LayerProducts';
import { LayerSets } from './LayerSets';
import { headerData, layerProductsMock, featuredDataset } from './products';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { ReactNode, useMemo, useState } from 'react';
import { cn } from '@/utils';
import { Button } from '../Button';
import { Product } from '@/constants';

export type HeaderData = {
  image: ImageType;
  title: string;
};
export type LayersDataset = {
  image: ImageType;
  title: string;
  icon: ReactNode;
  description: string;
  addToMap?: (product: Product, enabled: boolean) => void;
  layerId: string;
  visible: boolean;
  isError: boolean;
  legend?: ReactNode;
  product: Product;
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
  const [searchQuery] = useState('');
  const { productEnabled, productError } = useMapUIStore(
    useShallow(s => ({
      productEnabled: s.productEnabled,
      productError: s.productError,
    })),
  );
  const normalizedLayerSets = useMemo(() => {
    return featuredDataset.map(layer => {
      layer.visible = productEnabled[layer.product];
      layer.isError = productError[layer.product];
      return layer;
    });
  }, [productEnabled, productError]);

  const filteredLayerSets = useMemo(() => {
    return normalizedLayerSets.filter(layerSet =>
      layerSet.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [normalizedLayerSets, searchQuery]);

  return (
    <div className={cn('h-full pb-4', className)}>
      <Header className="hidden md:flex" image={headerData.image} title={headerData.title} />

      {/* <Search className="mt-4 md:px-2" fn={s => setSearchQuery(s)} /> */}

      <LayerSets
        title="Featured Data"
        layersDatasets={filteredLayerSets}
        className="md:px-2 mt-4"
      />

      <LayerProducts
        products={layerProductsMock}
        title="OC Products"
        className="mt-4 md:px-8 hidden"
      />

      {import.meta.env.VITE_FEEDBACK_ENABLED && <UserFeedback />}
    </div>
  );
};

const UserFeedback: React.FC = () => {
  return (
    <div className="md:px-2 mt-4">
      <div className="md:rounded-lg md:shadow-lg bg-white md:border border-b border-gray-300 p-4 flex items-start gap-2">
        <span className="text-xs text-gray-700 mb-2">
          Have you identified a bug, or have suggestions for new features? Please submit an issue
          using the provided templates.
        </span>
        <Button
          size="sm"
          variant="default"
          asChild={true}
          onClick={() =>
            window.open('https://github.com/aodn/imos-live-frontend/issues/new/choose')
          }
        >
          <span className="text-xs font-medium">Contribute</span>
        </Button>
      </div>
    </div>
  );
};
