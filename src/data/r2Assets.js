import manifest from "./generated/r2-assets-manifest.json"

export const getR2WorkImage = (workReference, imageName, useThumb = false) => {
  if (!workReference || !imageName) {
    return null
  }

  const image = manifest.works?.[workReference]?.images?.[imageName]

  if (!image) {
    return null
  }

  if (useThumb && image.thumb) {
    return {
      ...image,
      src: image.thumb.src,
      srcSet: "",
      width: image.thumb.width,
      height: image.thumb.height,
    }
  }

  return image
}
