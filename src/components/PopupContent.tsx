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
    <div style={{ fontSize: "14px" }}>
      <strong>Current Information</strong>
      <br />
      Lat: {lat.toFixed(4)}
      <br />
      Lng: {lng.toFixed(4)}
      <br />
      speed: {speed.toFixed(4)}
      <br />
      direction: {direction}
      <br />
      degree: {degree}°
    </div>
  );
};
