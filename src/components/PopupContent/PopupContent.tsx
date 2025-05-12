type PopupContentProps = {
  lat: number;
  lng: number;
  speed?: number;
  direction?: string;
  degree?: number;
  gsla?: number;
};

export const PopupContent = ({ lat, lng, speed, degree, direction, gsla }: PopupContentProps) => {
  return (
    <div className="p-2">
      <strong>Current Information</strong>

      {<p>Lat: {lat.toFixed(2)}</p>}
      {<p>Lng: {lng.toFixed(2)}</p>}
      {speed !== undefined && <p>speed: {speed.toFixed(2)} m/s</p>}
      {degree !== undefined && <p>direction: {direction}</p>}
      {direction !== undefined && <p>degree: {degree?.toFixed(2)}°</p>}
      {gsla !== undefined && <p>gsla: {gsla.toFixed(2)} m</p>}
    </div>
  );
};
