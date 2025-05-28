/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, useCallback } from 'react';
import { Chart } from './Chart';
import { generateYearsByStep } from '@/utils';

type ViewMode = 'range' | 'point' | 'combined';

type SliderProps = {
  viewMode: ViewMode;
  startYear: number;
  endYear: number;
  currentPointYear: number;
  allData: {
    year: number;
    value: number;
  }[];
  initialRange?: {
    start: number;
    end: number;
  };
};

export const Slider = ({
  viewMode,
  startYear,
  endYear,
  currentPointYear,
  allData,
  initialRange,
}: SliderProps) => {
  // Range mode state
  const [rangeStart, setRangeStart] = useState(initialRange?.start || 0);
  const [rangeEnd, setRangeEnd] = useState(initialRange?.end || 100);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'point' | null>(null);

  // Point mode state
  const [pointPosition, setPointPosition] = useState(50);

  const sliderRef = useRef<HTMLDivElement>(null);

  const yearsByStep = generateYearsByStep(startYear, endYear, 5);
  // Calculate data based on current mode
  const totalYears = allData.length;
  let visibleData = allData;
  let startYearCopy = startYear;
  let endYearCopy = endYear;
  let currentPointYearCopy = currentPointYear;

  if (viewMode === 'range') {
    const startIndex = Math.floor((rangeStart / 100) * (totalYears - 1));
    const endIndex = Math.floor((rangeEnd / 100) * (totalYears - 1));
    visibleData = allData.slice(startIndex, endIndex + 1);
    startYearCopy = allData[startIndex]?.year || 1990;
    endYearCopy = allData[endIndex]?.year || 2025;
  } else if (viewMode === 'point') {
    const pointIndex = Math.floor((pointPosition / 100) * (totalYears - 1));
    currentPointYearCopy = allData[pointIndex]?.year || 1990;
    // Show a wider range around the point for context
    const contextStart = Math.max(0, pointIndex - 10);
    const contextEnd = Math.min(totalYears - 1, pointIndex + 10);
    visibleData = allData.slice(contextStart, contextEnd + 1);
  } else if (viewMode === 'combined') {
    // Combined mode: show range with point
    const startIndex = Math.floor((rangeStart / 100) * (totalYears - 1));
    const endIndex = Math.floor((rangeEnd / 100) * (totalYears - 1));
    const pointIndex = Math.floor((pointPosition / 100) * (totalYears - 1));

    visibleData = allData.slice(startIndex, endIndex + 1);
    startYearCopy = allData[startIndex]?.year || startYear;
    endYearCopy = allData[endIndex]?.year || endYear;
    currentPointYearCopy = allData[pointIndex]?.year || currentPointYear;
  }

  // Range slider handlers
  const handleMouseDown = (handle: 'start' | 'end' | 'point') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleRangeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

      if (isDragging === 'start') {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else if (isDragging === 'end') {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      } else if (isDragging === 'point') {
        setPointPosition(percentage);
      }
    },
    [isDragging, rangeEnd, rangeStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Point slider handlers - now integrated into main mouse handlers
  const handlePointMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging('point');
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleRangeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleRangeMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleRangeMouseMove, handleMouseUp]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!sliderRef.current || isDragging) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    if (viewMode === 'range') {
      const distanceToStart = Math.abs(percentage - rangeStart);
      const distanceToEnd = Math.abs(percentage - rangeEnd);

      if (distanceToStart < distanceToEnd) {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      }
    } else if (viewMode === 'point') {
      setPointPosition(percentage);
    } else if (viewMode === 'combined') {
      // In combined mode, find the closest handle
      const distanceToStart = Math.abs(percentage - rangeStart);
      const distanceToEnd = Math.abs(percentage - rangeEnd);
      const distanceToPoint = Math.abs(percentage - pointPosition);

      const minDistance = Math.min(distanceToStart, distanceToEnd, distanceToPoint);

      if (minDistance === distanceToPoint) {
        setPointPosition(percentage);
      } else if (minDistance === distanceToStart) {
        setRangeStart(Math.min(percentage, rangeEnd - 5));
      } else {
        setRangeEnd(Math.max(percentage, rangeStart + 5));
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6  border-4">
      {/* chart */}
      <Chart
        viewMode={viewMode}
        visibleData={visibleData}
        currentPointYear={currentPointYearCopy}
      />

      {/* Slider Container */}
      <div className="relative border-2" ref={sliderRef}>
        {viewMode === 'range' ? (
          <>
            {/* Range Slider */}
            <div
              className="w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer"
              onClick={handleTrackClick}
              role="slider"
              tabIndex={0}
              aria-valuenow={pointPosition}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="absolute h-full bg-gray-300 rounded-l-full"
                style={{ width: `${rangeStart}%` }}
              />
              <div
                className="absolute h-full bg-gray-300 rounded-r-full right-0"
                style={{ width: `${100 - rangeEnd}%` }}
              />
              <div
                className="absolute h-full bg-blue-500 transition-all duration-200"
                style={{
                  left: `${rangeStart}%`,
                  width: `${rangeEnd - rangeStart}%`,
                }}
              />
            </div>

            {/* Start handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'start' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${rangeStart}%` }}
              onMouseDown={handleMouseDown('start')}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {startYearCopy}
              </div>
            </div>

            {/* End handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'end' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${rangeEnd}%` }}
              onMouseDown={handleMouseDown('end')}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {endYearCopy}
              </div>
            </div>
          </>
        ) : viewMode === 'point' ? (
          <>
            {/* Point Slider */}
            <div
              className="w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer"
              onClick={handleTrackClick}
            >
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-200"
                style={{ width: `${pointPosition}%` }}
              />
            </div>

            {/* Point handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-red-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'point' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${pointPosition}%` }}
              onMouseDown={handlePointMouseDown}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {currentPointYearCopy}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Combined Slider */}

            <div
              className="w-full h-2 bg-gray-300 rounded-full relative overflow-hidden cursor-pointer"
              onClick={handleTrackClick}
            >
              {/* Inactive sections */}
              <div
                className="absolute h-full bg-gray-300 rounded-l-full"
                style={{ width: `${rangeStart}%` }}
              />
              <div
                className="absolute h-full bg-gray-300 rounded-r-full right-0"
                style={{ width: `${100 - rangeEnd}%` }}
              />

              {/* Active range track */}
              <div
                className="absolute h-full bg-blue-500 transition-all duration-200"
                style={{
                  left: `${rangeStart}%`,
                  width: `${rangeEnd - rangeStart}%`,
                }}
              />

              {/* Point indicator line */}
              <div
                className="absolute h-full w-1 bg-red-500 transition-all duration-200"
                style={{ left: `${pointPosition}%` }}
              />
            </div>

            {/* Range start handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'start' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${rangeStart}%` }}
              onMouseDown={handleMouseDown('start')}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {startYearCopy}
              </div>
            </div>

            {/* Range end handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'end' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${rangeEnd}%` }}
              onMouseDown={handleMouseDown('end')}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600  text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {endYearCopy}
              </div>
            </div>

            {/* Point handle */}
            <div
              className={`absolute top-0 w-6 h-6 bg-white border-2 border-red-500 rounded-full shadow-lg cursor-pointer transform -translate-y-3 -translate-x-3 transition-all duration-200 hover:scale-110 ${
                isDragging === 'point' ? 'scale-110 shadow-xl' : ''
              }`}
              style={{ left: `${pointPosition}%` }}
              onMouseDown={handleMouseDown('point')}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {currentPointYearCopy}
              </div>
            </div>
          </>
        )}

        {/* Timeline labels */}
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          {yearsByStep.map(year => (
            <span key={year}>{year}</span>
          ))}
        </div>
      </div>

      {/* Display Information */}
      <div className="mt-4 text-center">
        range:{startYearCopy}-{endYearCopy} point:{currentPointYearCopy}
      </div>
    </div>
  );
};
