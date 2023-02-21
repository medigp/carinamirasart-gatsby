import React, { useState } from "react"
import styled from "styled-components"
import { DeviceSize } from "/src/data/responsive"
import { getTranslatedText } from "../../translate/TranslateText";

const getSizesValues = (sizes, showCmBlock=true) =>{
    let ret = []
    if(!sizes)
    return ret;
    for(let i = 0; i < sizes.length; i++)
        ret.push(getSizeValues(sizes[i], showCmBlock))
    return ret;
}
const getSizeValues = (sizes, showCmBlock = true) =>{
    if(!sizes)
        return null
    
    const { cm, inch } = sizes
    const { height : cm_height, width : cm_width, breadth : cm_breadth } = cm
    const { height : inch_height, width : inch_width, breadth : inch_breadth } = inch

    if(showCmBlock){
        return {
            h : cm_height +'cm',
            w : cm_width + 'cm',
            b : cm_breadth ? cm_breadth + 'cm' : null
        }
    }else{
        return {
            h : inch_height +'"',
            w : inch_width + '"',
            b : inch_breadth ? inch_breadth + '"' : null
        }
    }
}


const CompositionSchema = ({sizes, maxHeight = 100, showBreadth = true, alwaysShowBreadths = true, canChangeBreadth = false}) => {
    const [showCmBlock, setShowCmBlock] = useState(true)
    const [sizesValues, setSizesValues] = useState(() => getSizesValues(sizes, showCmBlock))
    const [breadthType, setBreadthType] = useState('default')

    if(!sizes)
        return null
    
    const sizeBlocksStyles = getSizeBlocksStyles(sizes);
    let summarySizes = ""; //cm_height+' x '+cm_width+'cm / '+inch_height+'" x '+inch_width+'"';

    function getSizeBlocksStyles(sizes){
        if(!sizes || sizes.length === 0)
            return null 
        let s = [];
        let definedMaxHeight = 100;
        const definedMinWidth = 20
        let maxHeight = 0
        let minWidth = 0
        for(let i=0; i < sizes.length; i++){
            const { cm } = sizes[i]
            let { height, width } = cm
            maxHeight = maxHeight < height ? height : maxHeight
            minWidth = (minWidth === 0 || minWidth > width) ? width : minWidth
        }

        // Ha de tenir un ample mínim de 10, pel
        if(minWidth < definedMinWidth){
            definedMaxHeight = definedMaxHeight * (definedMinWidth / minWidth)
        }
        
        // Es fa la proporció
        const factor = definedMaxHeight / maxHeight
    
        for(let i=0; i < sizes.length; i++){
            let elem = getSizeBlockStyle(sizes[i], factor)
            s.push(elem)
        }
        return s;
    }
    
    function getSizeBlockStyle(size, sizeFactor){
        if(!size)
            return null
        
        let{ cm } = size
        let { height : h, width : w, breadth : b } = cm
    
        if(!h || !w)
            return null
        
        if(!b)
            b = 0
        return {
            width : w * sizeFactor,
            height : h * sizeFactor,
            breadth : b * sizeFactor
        }
    }

    const breadthTypes = [ 'default' ,'top', 'left', 'right']
    const changeBreadthType = () => {
        if(!canChangeBreadth)
            return
        if(!breadthType){
            setBreadthType('default')
            return
        }

        for(let i = 0; i < breadthTypes.length; i++){
            if(breadthTypes[i] !== breadthType)
                continue
            const newPos = (i + 1) % breadthTypes.length
            setBreadthType(breadthTypes[newPos])
            break;
        }
    }
    
    const changeSizeUnities = (type = 'cm') => {
        let useCm = false;
        switch(type){
            case 'inch':
                useCm = false
                break;
            default:
                useCm = true
        }
        setShowCmBlock(useCm);
        updateSizesValues(useCm);
    }
    
    function updateSizesValues(useCm = true){
        setSizesValues( getSizesValues(sizes, useCm) )
    }
    
    if(!sizesValues || sizesValues.length === 0)
        return null

    const cmText = getTranslatedText('size.cm.mini')
    const inchText = getTranslatedText('size.inch.mini')

    const getSizeBlockClassName = (index, numTotal, sizeBlocksStyles, showBreadth, alwaysShowBreadths) => {
        if(!showBreadth || !sizesValues)
            return ''
        const { width, breadth } = sizeBlocksStyles[index]
        if(breadth === 0)
            return ''

        let classname = 'has-breadth ' + (alwaysShowBreadths ? 'show-all ' : '')
        if(breadthType !== 'default'){
            classname += 'breadth-on-'+breadthType
            return classname
        }

        const defineByNumberOfPictures = false 
        if(defineByNumberOfPictures){
            // Si n'hi ha més d'un, i estem a la meitat esquerra, es posarà a la dreta
            if(numTotal > 1 && (index + 1) < Math.round(numTotal / 2))
                return classname + 'breadth-on-right'
            // Sinó, si està a la meitat dreta, es posarà a l'esquerra
            else if((index + 1) > Math.round(numTotal / 2))
                return classname + 'breadth-on-left'
            // Sinó es posa a la part superior
            else 
                return classname + 'breadth-on-top'
        }else{
            const minWidth = 40;
            if(width < minWidth)
                return classname +'breadth-on-right'
            
            classname += 'breadth-on-top'
            if(numTotal === 1)
                return classname
            
            if(numTotal > 1 && (index + 1) < Math.round(numTotal / 2))
                return classname + ' breadth-on-top-right'
            // Sinó, si està a la meitat dreta, es posarà a l'esquerra
            else if((index + 1) > Math.round(numTotal / 2))
                return classname + ' breadth-on-top-left'
            return classname
        }
    }

    return (
        <CompositionSchemaWrapper>
            <MetricButtons>
                <MetricElement
                    onClick={() => { changeSizeUnities('cm')} }
                    className={showCmBlock ? 'selected' : ''}
                    >
                        {cmText}
                    </MetricElement>
                <MetricElement
                    onClick={() => { changeSizeUnities('inch')} }
                    className={showCmBlock ? '' : 'selected'}>
                        {inchText}
                    </MetricElement>
            </MetricButtons>
            <SizeDescription>
                {sizesValues.map((size, index) => (
                <SizeBlock
                    key={index.toString()}
                    title={summarySizes}
                    style={sizeBlocksStyles[index]}
                    className={ getSizeBlockClassName(index, sizesValues.length, sizeBlocksStyles, showBreadth, alwaysShowBreadths) }
                    onClick={() => { changeBreadthType()} }
                >
                    <SizeWidth
                        className='width-description'>
                        <span>{size.w}</span>
                    </SizeWidth>
                    <SizeHeight
                        className='height-description'>
                        <span>{size.h}</span>
                    </SizeHeight>
                    {showBreadth && size.b &&
                        <BreadthBlock
                            className='breadth-block'>
                            <SizeBreadth
                                className='breadth-description'>
                                <span>{size.b}</span>
                            </SizeBreadth>
                        </BreadthBlock>
                    }
                </SizeBlock>
                ))}
            </SizeDescription>
        </CompositionSchemaWrapper>
    )
}

export default CompositionSchema

const CompositionSchemaWrapper = styled.div`
    position:relative;
`

const SizeDescription = styled.div`
  text-align: center;
  display:flex;
  gap:30px;
  padding-top: 2rem;
  padding-bottom : 2rem;
  flex-wrap:nowrap;
  justify-content:center;
  align-items:center;
  position: relative;

    @media print {
        break-inside: avoid;
    }
`
const MetricButtons = styled.div`
    position:absolute;
    top:0;
    right:0;
    height:30px;
    line-height: 30px;
    overflow: hidden;
    z-index:10;

    @media print {
        display:none;
    }

    @media ( max-width : ${DeviceSize.mobile}px ){
        position:relative;
        text-align:right;
    }

`

const MetricElement = styled.div`
    display:inline-block;
    position:relative;
    padding: 0 5px;
    color: var(--primary-link-color);
    transition: all 0.2s ease-in;
    cursor: pointer;

    ::before{
        position:absolute;
        display:block;
        content:'';
        width:0px;
        height:3px;
        bottom:0px;
        left:0;
        background:var(--primary-link-hover-color);
        z-index:2;
        transition: all 0.2s ease-in 0.1s;
    }

    :not(.selected):hover{
        ::before{    
            z-index:3;
            width:100%;
        }
    }

    &.selected{
        color : var(--primary-link-hover-color);
    }

`

const SizeBlock = styled.div`
  display:block;
  position:relative;
  width:100px;
  height:100px;
  content:'';
  border:1px solid gray;
  background: #ccc;
  font-size:12px;
  z-index:2;

  &.has-breadth{
    transition: all 0.2s ease-in;

    &.show-all,
    :hover{
        translate: 5px;
    }

    @media print {
        translate: 5px;
    }

    &.show-all .breadth-block,
    :hover .breadth-block{
        width:10px;

        .breadth-description{
            opacity: 1;
        }

        :before,
        :after{
            opacity:1;
        }

        :before{
            border-width: 0 0 6px 10px;
            border-color: transparent transparent var(--primary-link-hover-color) transparent;
        }
    
        :after{
            border-width: 0 10px 6px 0;
            border-color: transparent var(--primary-link-hover-color) transparent transparent;
        }
    }

    @media print {
        .breadth-block{
            width:10px;
    
            .breadth-description{
                opacity: 1;
            }
    
            :before,
            :after{
                opacity:1;
            }
    
            :before{
                border-width: 0 0 6px 10px;
                border-color: transparent transparent var(--primary-link-hover-color) transparent;
            }
        
            :after{
                border-width: 0 10px 6px 0;
                border-color: transparent var(--primary-link-hover-color) transparent transparent;
            }
        }
    }

    

    &.breadth-on-right{
        .breadth-block{
            right: auto;
            left:100%;
        }

        &.show-all,
        :hover{
            translate: -5px;
        
            .breadth-block{
                :before{
                    border-width: 6px 0 0 10px;
                    border-color: transparent transparent transparent var(--primary-link-hover-color);
                }
            
                :after{
                    border-width: 6px 10px 0 0;
                    border-color: var(--primary-link-hover-color) transparent transparent transparent;
                }
            }

            .height-description{
                translate: 10px;
            }
        }

        @media print {
            translate: -5px;
        
            .breadth-block{
                :before{
                    border-width: 6px 0 0 10px;
                    border-color: transparent transparent transparent var(--primary-link-hover-color);
                }
            
                :after{
                    border-width: 6px 10px 0 0;
                    border-color: var(--primary-link-hover-color) transparent transparent transparent;
                }
            }

            .height-description{
                translate: 10px;
            }
        }
    }

    &.breadth-on-top{

        .breadth-block{
            width: calc(100% - 10px);
            top:auto;
            bottom:100%;
            height:0;
            left:5px;
            right:auto;

            :before{
                bottom:0;
                left:auto;
                right:100%;
            }

            :after{
                bottom:0;
                top:auto;
                right:auto;
                left:100%;
            }
        }

        &.show-all,
        :hover{
            translate: 0px 5px;

            .breadth-block{
                width: calc(100% - 10px);
                height:10px;

                :before{
                    border-width: 0 0 10px 6px;
                    border-color: transparent transparent var(--primary-link-hover-color) transparent;
                }
            
                :after{
                    border-width: 10px 0 0 6px;
                    border-color: transparent transparent transparent var(--primary-link-hover-color);
                }
            }
        }

        @media print {
            translate: 0px 5px;

            .breadth-block{
                width: calc(100% - 10px);
                height:10px;

                :before{
                    border-width: 0 0 10px 6px;
                    border-color: transparent transparent var(--primary-link-hover-color) transparent;
                }
            
                :after{
                    border-width: 10px 0 0 6px;
                    border-color: transparent transparent transparent var(--primary-link-hover-color);
                }
            }
        }

        .breadth-description{
            width:100%;
            text-align:center;

            span{
                left:0;
                width:100%;
            }
        }
    }
  }
`
const BreadthBlock = styled.div`
    display:block;
    position:absolute;
    top:5px;
    height:calc(100% - 10px);
    width:0px;
    right:100%;
    background-color: var(--primary-link-hover-color) !important;
    color-adjust: exact;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    transition: all 0.2s ease-in;

    :after,
    :before{
        display:block;
        position:absolute;
        content:'';
        width:0;height:0;
        border-style: solid;
        border-width:0;
        border-color: transparent;
        transition: all 0.2s ease-in;
        z-index:-1;
        opacity:0
    }

    :before{
        bottom:100%;
        border-width: 0;
        border-color: transparent transparent var(--primary-link-hover-color) transparent;
    }

    :after{
        top:100%;
        border-width: 0;
        border-color: transparent var(--primary-link-hover-color) transparent transparent;
    }

    &.breadth-on-right{
        :before{
            border-color: transparent transparent transparent var(--primary-link-hover-color);
        }
    
        :after{
            border-color: var(--primary-link-hover-color) transparent transparent transparent;
        }
    }

    .breadth-description{
        transition: all 0.2s ease-in;
        opacity: 0;
    }
`

const SizeWidth = styled.div`
    position:absolute;
    top: 100%; 
    left: 0;
    width:100%;
    text-align: center;
    z-index:2;
    transition: all 0.2s ease-in;

    span{
      display:inline-block;
      line-height:1rem;
      vertical-align:center;
    }
`

const SizeHeight = styled.div`
    position:absolute;
    top: 0; 
    left: 100%;
    text-align: center;
    height:100%;
    z-index:2;
    transition: all 0.2s ease-in;

    span{
      display:inline-block;
      line-height:1rem;
      vertical-align:center;
      height:100%;
      writing-mode: vertical-lr;
    }
`

const SizeBreadth = styled.div`
    position:absolute;
    bottom: calc(100% + 5px); 
    left: 0;
    width:100%;
    text-align: right;
    z-index:2;
    opacity:0;
    color: var(--primary-link-hover-color);
    transition: all 0.2s ease-in;

    span{
        display:inline-block;
        position:absolute;
        bottom:0;
        left:-5px;
    }
`