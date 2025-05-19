export const DistanceMeasurement = ({ distance }: { distance: string }) => {
  return (
    <div className="fixed top-10 left-10 z-10 bg-slate-400 shadow-sm  px-4 py-2 rounded">
      <p>Total distance: {distance} km</p>
    </div>
  );
};
