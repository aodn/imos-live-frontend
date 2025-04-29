type PopupContentProps = {
  lat: number;
  lng: number;
  speed: number;
  direction: string;
  degree: number;
  gsla: number;
};

export const PopupContent = ({
  lat,
  lng,
  speed,
  degree,
  direction,
  gsla,
}: PopupContentProps) => {
  return (
    <div className="p-2">
      <strong>Current Information</strong>
      <br />
      Lat: {lat.toFixed(2)}
      <br />
      Lng: {lng.toFixed(2)}
      <br />
      speed: {speed.toFixed(2)} m/s
      <br />
      direction: {direction}
      <br />
      degree: {degree.toFixed(2)}°
      <br />
      gsla: {gsla.toFixed(2)} m
    </div>
  );
};
