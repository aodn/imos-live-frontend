// import { cn } from '@/utils';
// import { Button } from '../Button';
// import { SliderHandleProps } from './type';
// import { useLayoutEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
// import { createPortal } from 'react-dom';

// export const SliderHandle = ({
//   onDragging,
//   position,
//   label,
//   icon,
//   onMouseDown,
//   className,
//   labelClassName,
//   trackRef,
// }: SliderHandleProps) => {
//   const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
//   const handleRef = useRef<HTMLButtonElement>(null);
//   const rafRef = useRef<number>(0);
//   const handleWidthRef = useRef<number>(40);

//   const updatePosition = useCallback(() => {
//     if (!trackRef.current) return;

//     // Measure handle width only when needed and cache it
//     if (handleRef.current && handleRef.current.offsetWidth > 0) {
//       handleWidthRef.current = handleRef.current.offsetWidth;
//     }

//     const containerRect = trackRef.current.getBoundingClientRect();
//     const actualLeft =
//       containerRect.left + (containerRect.width * position) / 100 - handleWidthRef.current / 2;
//     const top = containerRect.top;

//     setPortalStyle({
//       position: 'fixed',
//       left: actualLeft,
//       top: top,
//       zIndex: 999,
//     });
//   }, [position, trackRef]);

//   const throttledUpdate = useCallback(() => {
//     if (rafRef.current) {
//       cancelAnimationFrame(rafRef.current);
//     }
//     rafRef.current = requestAnimationFrame(updatePosition);
//   }, [updatePosition]);

//   useLayoutEffect(() => {
//     updatePosition();

//     window.addEventListener('scroll', throttledUpdate, { passive: true });
//     window.addEventListener('resize', throttledUpdate, { passive: true });

//     return () => {
//       if (rafRef.current) {
//         cancelAnimationFrame(rafRef.current);
//       }
//       window.removeEventListener('scroll', throttledUpdate);
//       window.removeEventListener('resize', throttledUpdate);
//     };
//   }, [updatePosition, throttledUpdate]);

//   // Memoize button className to prevent recalculation
//   const buttonClassName = useMemo(
//     () =>
//       cn(
//         'absolute z-20 transform transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
//         className,
//         { 'scale-110': onDragging },
//       ),
//     [className, onDragging],
//   );

//   // Memoize portal content
//   const portalContent = useMemo(
//     () => (
//       <Button
//         ref={handleRef}
//         size={'icon'}
//         variant={'ghost'}
//         className={buttonClassName}
//         style={portalStyle}
//         onMouseDown={onMouseDown}
//       >
//         <HandleLabel label={label} labelClassName={labelClassName} isDragging={onDragging} />
//         {icon}
//       </Button>
//     ),
//     [buttonClassName, portalStyle, onMouseDown, label, labelClassName, onDragging, icon],
//   );

//   return trackRef.current ? createPortal(portalContent, document.body) : null;
// };

// // Memoize HandleLabel to prevent unnecessary re-renders
// const HandleLabel = memo(
//   ({
//     labelClassName,
//     label,
//     isDragging,
//   }: {
//     labelClassName?: string;
//     label: string;
//     isDragging?: boolean;
//   }) => {
//     const labelClass = useMemo(
//       () =>
//         cn(
//           'absolute transform -translate-y-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity duration-200',
//           { 'invisible opacity-0': !isDragging },
//           labelClassName,
//         ),
//       [isDragging, labelClassName],
//     );

//     return <div className={labelClass}>{label}</div>;
//   },
// );
// import { cn } from '@/utils';
// import { Button } from '../Button';
// import { SliderHandleProps } from './type';
// import { useLayoutEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
// import { createPortal } from 'react-dom';

// export const SliderHandle = ({
//   onDragging,
//   position,
//   label,
//   icon,
//   onMouseDown,
//   className,
//   labelClassName,
//   trackRef,
// }: SliderHandleProps) => {
//   const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
//   const handleRef = useRef<HTMLButtonElement>(null);
//   const handleWidthRef = useRef<number>(40);

//   const updatePosition = useCallback(() => {
//     if (!trackRef.current) return;

//     // Measure handle width only when needed and cache it
//     if (handleRef.current && handleRef.current.offsetWidth > 0) {
//       handleWidthRef.current = handleRef.current.offsetWidth;
//     }

//     const containerRect = trackRef.current.getBoundingClientRect();

//     // Calculate the actual left position
//     const actualLeft =
//       containerRect.left + (containerRect.width * position) / 100 - handleWidthRef.current / 2;
//     const top = containerRect.top;

//     setPortalStyle({
//       position: 'fixed',
//       left: actualLeft,
//       top: top,
//       zIndex: 999,
//     });
//   }, [position, trackRef]);

//   // Use requestAnimationFrame for smooth updates
//   useLayoutEffect(() => {
//     const update = () => {
//       updatePosition();
//       requestAnimationFrame(update);
//     };

//     const rafId = requestAnimationFrame(update);

//     return () => {
//       cancelAnimationFrame(rafId);
//     };
//   }, [updatePosition]);

//   // Also update on window events
//   useLayoutEffect(() => {
//     const handleUpdate = () => updatePosition();

//     window.addEventListener('scroll', handleUpdate, { passive: true });
//     window.addEventListener('resize', handleUpdate, { passive: true });

//     return () => {
//       window.removeEventListener('scroll', handleUpdate);
//       window.removeEventListener('resize', handleUpdate);
//     };
//   }, [updatePosition]);

//   // Memoize button className to prevent recalculation
//   const buttonClassName = useMemo(
//     () =>
//       cn(
//         'absolute  transform transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
//         className,
//         { 'scale-110': onDragging },
//       ),
//     [className, onDragging],
//   );

//   // Memoize portal content
//   const portalContent = useMemo(
//     () => (
//       <Button
//         ref={handleRef}
//         size={'icon'}
//         variant={'ghost'}
//         className={buttonClassName}
//         style={portalStyle}
//         onMouseDown={onMouseDown}
//       >
//         <HandleLabel label={label} labelClassName={labelClassName} isDragging={onDragging} />
//         {icon}
//       </Button>
//     ),
//     [buttonClassName, portalStyle, onMouseDown, label, labelClassName, onDragging, icon],
//   );

//   return trackRef.current ? createPortal(portalContent, document.body) : null;
// };

// // Memoize HandleLabel to prevent unnecessary re-renders
// const HandleLabel = memo(
//   ({
//     labelClassName,
//     label,
//     isDragging,
//   }: {
//     labelClassName?: string;
//     label: string;
//     isDragging?: boolean;
//   }) => {
//     const labelClass = useMemo(
//       () =>
//         cn(
//           'absolute transform -translate-y-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity duration-200',
//           { 'invisible opacity-0': !isDragging },
//           labelClassName,
//         ),
//       [isDragging, labelClassName],
//     );

//     return <div className={labelClass}>{label}</div>;
//   },
// );
import { cn } from '@/utils';
import { Button } from '../Button';
import { SliderHandleProps } from './type';

export const SliderHandle = ({
  onDragging,
  position,
  label,
  icon,
  onMouseDown,
  className,
  labelClassName,
}: SliderHandleProps) => {
  return (
    <Button
      size={'icon'}
      variant={'ghost'}
      className={cn(
        'absolute pointer-events-auto z-20 transform  -translate-x-1/2 transition-all duration-50 hover:scale-110 hover:bg-transparent active:bg-transparent focus-visible:ring-0',
        className,
        { 'scale-110': onDragging },
      )}
      style={{ left: `${position}%` }}
      onMouseDown={onMouseDown}
    >
      {onDragging && (
        <div
          className={cn(
            'absolute top-0  left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
            labelClassName,
          )}
        >
          {label}
        </div>
      )}
      {icon}
    </Button>
  );
};
