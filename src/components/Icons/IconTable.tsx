import React from 'react';
import { IconProps, icons } from '@/components/Icons';

type IconName = keyof typeof icons;

export function IconTable(props: IconProps) {
  return (
    <div className="center grid grid-cols-4 gap-4 tablet:grid-cols-8 desktop:grid-cols-12">
      {Object.keys(icons).map(key => {
        const icon = icons[key as IconName];
        return (
          <React.Fragment key={key}>
            <div key={key} className="flex flex-col">
              <span className="inline-flex justify-center border border-dashed border-purple py-4">
                {React.createElement(icon, props)}
              </span>
              <span className="mt-1 text-center text-sm text-grey-1">{key}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
