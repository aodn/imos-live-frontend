import React, { useState } from 'react';
import { Input } from '../Input';
import { Button, CollapsibleComponent, ConfigIcon, SearchIcon } from '..';
import { FeaturedCard, FeaturedCardProps } from './FeaturedCard';
import { LayerProducts } from './LayerProducts';
import { useToggle } from '@/hooks';
import { Header } from './Header';
import { LayerProductsCollapsibleTrigger } from './LayerProductsCollapsibleTrigger';
import { ImageType } from '@/types';

export type HeaderData = {
  image: ImageType;
  title: string;
};
export type FeaturedDataset = {
  image: ImageType;
  title: string;
  description: string;
  addToMap: () => void;
};

export type LayerProducts = {
  label: string;
  Icon?: React.ComponentType<any>;
  fn?: () => void;
}[];

interface MainSidebarProps {
  headerData: HeaderData;
  featuredDatasets: FeaturedCardProps[];
  layerProducts: LayerProducts;
  className?: string;
}

export const MainSidebarContent: React.FC<MainSidebarProps> = ({
  headerData,
  featuredDatasets,
  layerProducts,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { open, toggle } = useToggle(false);

  const onChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearch = (v: string) => () => {
    console.log('search query', v);
  };
  //TODO: 1. encapsulate the search in a component. 2. encapsulate layers products in a component. 3. add functionality to the search input, layer products and featured datasets.
  return (
    <div className={`h-full  ${className}`}>
      {/* Header */}
      <Header {...headerData} />

      {/* Search Input */}
      <div className="px-2 mt-4">
        <Input
          wrapperClassName="w-full"
          value={searchQuery}
          onChange={onChange}
          label={'Search for open data'}
          slotSuffix={
            <div className="flex items-center gap-x-2">
              <Button
                size={'icon'}
                variant={'secondary'}
                className="hover:scale-110 active:scale-110 transition-transform"
              >
                <ConfigIcon color="imos-grey" />
              </Button>

              <Button
                onClick={handleSearch(searchQuery)}
                size={'icon'}
                className="hover:scale-110 active:scale-110 transition-transform"
              >
                <SearchIcon color="imos-white" />
              </Button>
            </div>
          }
        />
      </div>

      {/*Featured Functions  */}
      <h2 className="text-lg font-bold px-2 mt-4">Featured Functions</h2>
      <div className="flex flex-col gap-y-4 px-2 mt-4">
        {featuredDatasets.map(dataset => (
          <div key={dataset.title}>
            <FeaturedCard
              image={dataset.image}
              title={dataset.title}
              description={dataset.description}
              addToMap={dataset.addToMap}
            />
          </div>
        ))}
      </div>

      {/* Layers products */}
      <div className="mt-4 px-8">
        <CollapsibleComponent
          wrapperClassName="border rounded-lg shadow-lg"
          direction="up"
          open={open}
          trigger={
            <LayerProductsCollapsibleTrigger
              title="OC Products"
              open={open}
              onToggle={toggle}
              direction="up"
            />
          }
        >
          {<LayerProducts className="px-4 py-2" products={layerProducts} />}
        </CollapsibleComponent>
      </div>
    </div>
  );
};
