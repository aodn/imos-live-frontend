import { Header } from './Header';
import type { ImageType } from '@/types';
import { LayerSets } from './LayerSets';
import { headerData, featuredDataset } from './products';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { cn } from '@/utils';
import { Button } from '../Button';
import type { ProductType } from '@/constants';

export type HeaderData = {
  image: ImageType;
  title: string;
};
export type LayersDataset = {
  image: ImageType;
  title: string;
  icon: ReactNode;
  description: string;
  addToMap: (product: ProductType, enabled: boolean) => void;
  layerId: string;
  visible: boolean;
  isError: boolean;
  legend?: ReactNode;
  product: ProductType;
  portalLink?: string;
};

type MainSidebarProps = {
  className?: string;
};

export function MainSidebarContent({ className = '' }: MainSidebarProps) {
  const { productEnabled, productError } = useMapUIStore(
    useShallow(s => ({
      productEnabled: s.productEnabled,
      productError: s.productError,
    })),
  );
  const normalizedLayerSets = useMemo(() => {
    return featuredDataset.map(layer => ({
      ...layer,
      visible: productEnabled[layer.product],
      isError: productError[layer.product],
    }));
  }, [productEnabled, productError]);

  return (
    <div className={cn('h-full pb-4', className)}>
      <Header className="hidden md:flex" image={headerData.image} title={headerData.title} />

      <LayerSets
        title="Featured Data"
        layersDatasets={normalizedLayerSets}
        className="md:px-2 mt-4"
      />

      {import.meta.env.VITE_FEEDBACK_ENABLED === 'true' && <UserFeedback />}
    </div>
  );
}

function UserFeedback() {
  return (
    <div className="md:px-2 mt-4">
      <div className="md:rounded-lg md:shadow-lg bg-white md:border border-b border-gray-300 p-4 flex items-start gap-2">
        <span className="text-xs text-gray-700 mb-2">
          Have you identified a bug, or have suggestions for new features? Please submit your
          feedback and help us improve.
        </span>
        <Button variant="link" asChild>
          <a
            className="text-xs font-medium"
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=VV3rFZEZvEaNp6slI03uCMGDphyKDCVOs7D1DWwRDU5URFdTTVpKWkpGWk9RVTI5WTZLQTFMN09WMC4u"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute
          </a>
        </Button>
      </div>
    </div>
  );
}
