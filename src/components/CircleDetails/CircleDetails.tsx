import { WaveBuoyOgcProperties } from '@/types';
import { Fragment } from 'react/jsx-runtime';

export const CircleDetails = (props: WaveBuoyOgcProperties) => {
  return (
    <div className="!opacity-100 !translate-y-0 !h-auto bg-white">
      <>
        <h2>Wave Buoy Data</h2>
        <div className="hidden">Wave Buoy Data</div>

        <div className="w-full">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-4  p-6  text-sm ">
            {Object.entries(props).map(([key, value]) => (
              <Fragment key={key}>
                <dt className="font-semibold capitalize text-gray-700">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-gray-900 break-words">
                  {key === 'url' ? (
                    <a
                      href={`https://thredds.aodn.org.au/thredds/fileServer/${value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {value}
                    </a>
                  ) : value !== null ? (
                    value.toString()
                  ) : (
                    <span className="text-gray-400 italic">null</span>
                  )}
                </dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </>
    </div>
  );
};
