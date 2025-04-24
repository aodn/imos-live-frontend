type PopupContentProps = {
  lat: number;
  lng: number;
  speed: number;
  direction: string;
  degree: number;
};

export const PopupContent = ({
  lat,
  lng,
  speed,
  degree,
  direction,
}: PopupContentProps) => {
  return (
    <div className="p-1">
      <strong>Current Information</strong>
      <br />
      Lat: {lat.toFixed(2)}
      <br />
      Lng: {lng.toFixed(2)}
      <br />
      speed: {speed.toFixed(2)}
      <br />
      direction: {direction}
      <br />
      degree: {degree.toFixed(2)}°
    </div>
  );
};
