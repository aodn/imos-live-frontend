function VectorImage(url: string) {
  //this function loads an image containing the vector data stored in R and G channels
  //It requires the bounds of the data in [minx, miny, maxx, maxy] and [min, max]
  //of the vector components used when encoding the field in the image
  return new Promise((resolve, reject) => {
    const data = new Image();
    data.src = url;
    data.onload = () => resolve(data);
    data.onerror = () => reject('Error');
  });
}

export default VectorImage;
