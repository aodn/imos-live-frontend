import { useState } from 'react';
import { Button } from '../Button';
import { ConfigIcon, SearchIcon } from '../Icons';
import { Input } from '../Input';
import { cn } from '@/utils';

type SearchProps = {
  className?: string;
  label?: string;
  fn?: () => void;
};

export const Search = ({ label, fn, className }: SearchProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const onChange = (value: string) => {
    setSearchQuery(value);
  };
  const handleSearch = (v: string) => () => {
    console.log('search query', v);
    if (fn) fn();
  };

  return (
    <div className={cn('px-2 mt-4', className)}>
      <Input
        wrapperClassName="w-full"
        value={searchQuery}
        onChange={onChange}
        label={label || 'Search for open data'}
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
  );
};
