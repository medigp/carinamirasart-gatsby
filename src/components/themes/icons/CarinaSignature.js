import React from 'react'
import styled from 'styled-components'

export default function CarinaSignature({ className }) {
  return (
    <StyledSignature
      className={['carina-signature-icon', className].filter(Boolean).join(' ')}
      role="img"
      aria-label="Carina Miras.art"
    />
  )
}

const StyledSignature = styled.span`
  display: inline-block;
  width: 0.5em;
  height: 1em;
  background-color: currentColor;
  transition: all 0.5s ease;
  vertical-align: -0.125em;
  -webkit-mask: url('/assets/carina-signature.svg') center / contain no-repeat;
  mask: url('/assets/carina-signature.svg') center / contain no-repeat;
`
