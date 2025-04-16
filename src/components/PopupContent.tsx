type PopupContentProps = {
  lat: number;
  lng: number;
  speed: number;
  direction: string;
};

export const PopupContent = ({
  lat,
  lng,
  speed,
  direction,
}: PopupContentProps) => {
  return (
    <div style={{ fontSize: "14px" }}>
      <strong>React Popup</strong>
      <br />
      Lat: {lat.toFixed(4)}
      <br />
      Lng: {lng.toFixed(4)}
      <br />
      speed: {speed.toFixed(4)}
      <br />
      direction: {direction}
    </div>
  );
};
