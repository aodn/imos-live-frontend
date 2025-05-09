import {
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";
import { WaveBuoyProperties } from "@/types";
import React from "react";

export const CircleDetails = (props: WaveBuoyProperties) => {
  return (
    <DrawerContent className="!opacity-100 !translate-y-0 !h-auto bg-white">
      {() => (
        <>
          <DrawerHeader>Wave Buoy Data</DrawerHeader>
          <DrawerBody>
            <div className="w-full">
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-4  p-6  text-sm ">
                {Object.entries(props).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <dt className="font-semibold capitalize text-gray-700">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-gray-900 break-words">
                      {key === "url" ? (
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
                  </React.Fragment>
                ))}
              </dl>
            </div>
          </DrawerBody>
          <DrawerFooter></DrawerFooter>
        </>
      )}
    </DrawerContent>
  );
};
