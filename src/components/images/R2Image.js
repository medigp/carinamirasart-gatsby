import React from "react"
import styled from "styled-components"

const R2Picture = styled.picture`
  display: block;
  width: 100%;

  img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: var(--r2-object-fit, cover);
  }
`

const R2Image = ({ asset, alt, className, style, objectFit = "cover", loading = "lazy", onClick }) => {
  if (!asset) {
    return null
  }

  return (
    <R2Picture
      className={className}
      style={{
        ...style,
        "--r2-object-fit": objectFit,
      }}
      onClick={onClick}
    >
      {asset.srcSet ? <source type="image/webp" srcSet={asset.srcSet} sizes="(min-width: 900px) 50vw, 100vw" /> : null}
      <img src={asset.src} width={asset.width} height={asset.height} alt={alt || ""} loading={loading} decoding="async" />
    </R2Picture>
  )
}

export default R2Image
