import React from "react"
import styled from "styled-components"
import { useState, useEffect } from 'react';
import { GatsbyImage, getImage } from "gatsby-plugin-image"

const LazyBgImage = (props) => {
    //console.log(props)
    const { src, placeholder, alt} = props
    const [imageLoaded, setImageLoaded] = useState(false);
    
    useEffect(() => {
        // Create an image element that we will set the src of
        const imageElement = new Image();
        
        // When the image finishes loading, set the imageLoaded state to true
        imageElement.onload = () => setImageLoaded(true);
    
        // Set the src of the image element to trigger the loading of the image
        imageElement.src = src;
      }, [src]); // Only re-run the effect if the src changes
    
      return (
        <PictureContainer
            style={{
                backgroundImage: `url(${imageLoaded ? src : placeholder})`,
          }}
        >

        </PictureContainer>
      );
    }
    

export default LazyBgImage

const LazyContainer = styled.div``

const PictureContainer = styled.div`
        position: relative;
        width:100%;
        min-height:50px;
        box-sizing: border-box;
        position:relative;
        float:left;
        z-index:1;
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        background-attachment: fixed;
        transition: all 0.5s ease;
    
    
        /* LazyLoaderBackground block */
        .background-lazy-loader{
            position:absolute;
            top:0;left:0;
            width:100%;height:100%;
            opacity:0;
            z-index:-1;
            filter: blur(5px);
            -webkit-filter: blur(5px);
            background: #536976;
            background-position: center center;
            background-repeat: no-repeat;
            background-size: cover;
            background-attachment: fixed;
            transition: all 0.7s ease;
            background-image: -webkit-linear-gradient(to right, #292E49, #536976);
            background-image: linear-gradient(to right, #292E49, #536976);
        }
        
        .background-lazy-loader.add-animation{
            background-size: 400% 100%;
            animation: lbg-gradient 10s ease infinite;
        }
        
        /* Loading */
        .loading{
            background-image:none !important;
        }
        .loading .background-lazy-loader {
            opacity:1;
        }
        
        /* Download */
        .downloaded{
            box-shadow : 0px 0px 15px gray;
        }
        .downloaded .background-lazy-loader{
            /*transform: scale(0.95);*/
            filter: blur(10px);
            -webkit-filter: blur(10px);
        }
        
        @keyframes lbg-gradient {
            0% {
            background-position: 0% 50%;
            }
            50% {
            background-position: 100% 50%;
            }
            100% {
            background-position: 0% 50%;
            }
        }
`

