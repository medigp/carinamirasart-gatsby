const path = require("path")

const defaultSerie = 'Miscellany'
/**
 * CREATE SCHEDMA : Definició dels tipus de GraphQL
 */
exports.createSchemaCustomization = ({ actions }) => {
    actions.createTypes(`
        interface SerieInterface implements Node{
            id: ID!
            url : String!
            seo : Seo
            hide : Boolean
            reference : String!
            order : Int!
            pageName : String!
            breadcrumbs : [ BreadCrumb ]
            date: Date @dateformat
            serie: String!
            classification : ClassificationData
            image : ImageGroup!
            title: String!
            subtitle : String
            quote : Quote
            description : String
            body: String
            lastModifiedDate: Date @dateformat
        }

        type Serie implements Node & SerieInterface @dontInfer{
            id: ID!
            url : String!
            seo : Seo
            hide : Boolean
            reference : String!
            order : Int!
            pageName : String!
            breadcrumbs : [ BreadCrumb ]
            date: Date @dateformat
            serie: String!
            classification : ClassificationData
            image : ImageGroup!
            title: String!
            subtitle : String
            quote : Quote
            description : String
            body: String
            lastModifiedDate: Date @dateformat
        }

        interface PaintInterface implements Node{
            id: ID!
            url : String!
            seo : Seo
            hide : Boolean
            reference : String!
            order : Int!
            pageName : String!
            breadcrumbs : [ BreadCrumb ]
            date: Date @dateformat
            classification : ClassificationData!
            serieData : Serie
            image : ImageGroup!
            sizes : [ SizesGroup ]!
            title: String!
            subtitle : String
            quote : Quote
            description : String
            body: String
            sellingData : SellingData
            lastModifiedDate: Date @dateformat
        }

        type Paint implements Node & PaintInterface @dontInfer{
            id: ID!
            url : String!
            seo : Seo
            hide : Boolean
            reference : String!
            pageName : String!
            order : Int!
            breadcrumbs : [ BreadCrumb ]
            date: Date @dateformat
            classification : ClassificationData!
            serieData : Serie
            image : ImageGroup!
            sizes : [ SizesGroup ]!
            title: String!
            subtitle : String
            quote : Quote
            description : String
            body: String
            sellingData : SellingData
            lastModifiedDate: Date @dateformat
        }

        interface PageTextInterface implements Node{
            id: ID!
            reference : String
            seo : Seo
            image : ImageGroup
            paragraphs : [ Paragraph ]
            body: String
            lastModifiedDate: Date @dateformat
        }

        type PageText implements Node & PageTextInterface @dontInfer{
            id: ID!
            reference : String
            seo : Seo
            image : ImageGroup
            paragraphs : [ Paragraph ]
            body: String
            lastModifiedDate: Date @dateformat
        }

        type Mdx implements Node{
            formatter : MdxFrontmatter!
        }

        type MdxFrontmatter{
            reference : String
            hide : Boolean
            url : String
            date : Date
            order : Int
            productState : ProductStatesEnum
            image : ImageGroup
            breadcrumbs : [ BreadCrumb ]
            description : String
            body: String
            seo : Seo
            quote : Quote
            sizes : [ SizesGroup ]
            classification : ClassificationData
            sellingData : SellingData
            paragraphs : [ Paragraph ]
            lastModifiedDate: Date @dateformat
        }

        type Paragraph {
            text : String!
            image : File @fileByRelativePath
            author : String
            authorTitle : String
        }

        type BreadCrumb {
            text : String!
            url : String!
        }

        enum ProductStatesEnum{
            ForSale,
            Reserved,
            Sold
        }

        type ImageGroup {
            main : File @fileByRelativePath
            image_alt_text : String!
            otherImages : [ File ] @fileByRelativePath
        }

        type ClassificationData {
            serie: String
            category : CategoryClassificationEnum
            orientation : OrientationEnum
            technique : String
            composition: String
            surface : String
            style: String
            tags : [ String ]
        }

        enum CategoryClassificationEnum {
            Painting,
            Drawing,
            Photography,
            Collage
        }

        enum OrientationEnum {
            Portrait,
            Landscape,
            Square,
            Free
        }

        type SizesGroup {
            cm : Sizes
            inch : Sizes
        }

        type Sizes {
            height : Float!
            width : Float!
            breadth: Float
        }

        type SellingData {
            productState : ProductStatesEnum!
            showProductState : Boolean
            priceDollar : Float!
            priceEur : Float!
            showPrice : Boolean
        }

        type Quote {
            text : String
            author : String
            showQuote : Boolean
        }

        type Seo {
            description : String
            keywords : [ String ]
            image : File @fileByRelativePath
        }
    `)
}

/**
 * CREATE NODES : convertir els Mdx de series i pintures a l'esquema definit, i assegurar valors
 */
 const calcBreadCrumbs = (serie, paint) => {
    let bc = []
    if(!serie && !paint)
        return bc
    let galleryElement = calcBreadCrumbElement('Gallery')
    let url = ''
    bc.push(galleryElement)
    if(serie && process.env.GATSBY_CREATE_GALLERY_SERIES){
        let serieElement = calcBreadCrumbElement(serie, url)
        if(serieElement !== null)
            bc.push(serieElement)
    }   
    if(paint){
        let paintElement = calcBreadCrumbElement(paint, url)
        if(paintElement !== null)
            bc.push(paintElement)
    }
    return bc
}

const calcBreadCrumbElement = (text, urlPath) => {
    if(!text)
        return null
    const url = (urlPath === undefined ? '' : urlPath) + '/' + sanitizeUrl(text)
    return {
        text,
        url
    }
}

exports.onCreateNode = ({ node, getNode, actions, createNodeId }) => {
    if(node.internal.type !== 'Mdx')
        return;
    const { parent } = node
    const fileAbsolutePath = node.internal.contentFilePath;
    const paintRegEx = new RegExp(/\/content\/paints\//g)
    let isPaint = paintRegEx.test(fileAbsolutePath)
    const serieRegEx = new RegExp(/\/content\/series\//g)
    let isSerie = serieRegEx.test(fileAbsolutePath)
    const pageTextRegEx = new RegExp(/\/content\/pageTexts\//g)
    let isPageText = pageTextRegEx.test(fileAbsolutePath)
    

    if(isPageText){
        console.log("PageText", fileAbsolutePath)
        let { paragraphs, reference } = node.frontmatter;
        if(!reference){
            const patternName = /([\w\d_-]*)\.?[^\\\/]*$/i;
            reference = fileAbsolutePath.match(patternName)[1]
        }
        actions.createNode({
            id: createNodeId(`PageText-${node.id}`),
            reference : reference,
            seo : getSeoObjectByNode(node, null, 'PageText'),
            image : getImageObjectByNode(node),
            paragraphs : paragraphs,
            lastModifiedDate : getLastModifiedDateByNode(node),
            body : node.body,
            internal : {
                type : 'PageText',
                contentDigest : node.internal.contentDigest
            }
        })
    }else if(isSerie){
        //console.log("Serie", fileAbsolutePath)
        //Node de pintures
        const { serie = defaultSerie, pageName, hide = false, reference } = node.frontmatter;
        if(!serie)
            return;
        //Sense ordenar per series
        const _serie = serie || pageName
        const urlRef = sanitizeUrl(_serie || reference || pageName)
        const _url = '/gallery/' + urlRef
        const _breadcrumbs = calcBreadCrumbs(_serie, null)
        const _classification= getClassificationDataObjectByNode(node)
        actions.createNode({
            id: createNodeId(`Serie-${node.id}`),
            hide : hide,
            url : _url,
            pageName : pageName || _serie,
            seo : getSeoObjectByNode(node, _classification, 'Serie'),
            reference : reference || urlRef,
            order : node.frontmatter.order || 0,
            breadcrumbs : _breadcrumbs,
            date : node.frontmatter.date,
            serie : _serie,
            classification : _classification,
            image : getImageObjectByNode(node),
            title : node.frontmatter.title,
            subtitle : node.frontmatter.subtitle,
            quote : getQuoteObjectByNode(node),
            description : node.frontmatter.description,
            lastModifiedDate : getLastModifiedDateByNode(node),
            body : node.body,
            parent : node.id,
            internal : {
                type : 'Serie',
                contentDigest : node.internal.contentDigest
            }
        })
    }else if(isPaint){
        //console.log("Paint",fileAbsolutePath)
        //Node de pintures
        const { classification = {}, pageName, url, reference, hide = false} = node.frontmatter
        const {serie = defaultSerie} = classification

        //Sense les series
        //const _url = '/gallery/'+ serie.toLowerCase() + '/' + pageName.toLowerCase()
        //const _breadcrumbs = [ 'Gallery', serie, pageName.toLowerCase() ]

        const _reference = (reference || pageName)
        const parentNode = getNode(parent)
        const defaultUrl = (parentNode.relativeDirectory).split('/').pop()
        console.log("defaultUrl", parentNode.relativeDirectory, defaultUrl)
        const _pageName = (_reference || defaultUrl)
        const urlRef = sanitizeUrl(url || _pageName)
        //console.log(node.frontmatter.title, urlRef, parentNode.relativeDirectory, defaultUrl)

        //Sense ordenar per series
        /*const _url = process.env.GATSBY_CREATE_GALLERY_SERIES ? 
            '/gallery/' +  serie.toLowerCase() + '/'+ urlRef :    
            '/gallery/' +  urlRef*/
        const _url = '/item/' + urlRef
        const _breadcrumbs = calcBreadCrumbs(serie, _pageName)
        const _classification = getClassificationDataObjectByNode(node)

        actions.createNode({
            id: createNodeId(`Paint-${node.id}`),
            hide : hide,
            url : sanitizeUrl(_url),
            seo : getSeoObjectByNode(node, _classification, 'Paint'),
            reference : _reference || urlRef,
            order : node.frontmatter.order || 0,
            pageName : _pageName,
            breadcrumbs : _breadcrumbs,
            date : node.frontmatter.date,
            classification : _classification,
            image : getImageObjectByNode(node),
            sizes : getSizesGroupObjectByNode(node),
            title : node.frontmatter.title,
            subtitle : node.frontmatter.subtitle,
            quote : getQuoteObjectByNode(node),
            description : node.frontmatter.description,
            body : node.body,
            sellingData : getSellingDataByNode(node),
            lastModifiedDate : getLastModifiedDateByNode(node),
            parent : node.id,
            internal : {
                type : 'Paint',
                contentDigest : node.internal.contentDigest
            }
        })
    }else{
        console.log("Undefined Mdx", fileAbsolutePath)
    }
}

/*
    UTILITATS per les dades en el CreateNodes
*/
const getLastModifiedDateByNode = (node) => {
    try{
        const { lastModifiedDate } = node.frontmatter
        if(lastModifiedDate instanceof Date)
            return lastModifiedDate
    }catch(error){
        
    }finally{
        return new Date()
    }
}

const getImageObjectByNode = ( node ) => {
    if(!node)
        return undefined
    const { image, description, subtitle, title } = node.frontmatter;
    if(!image)
        return undefined
    const{ main = "", image_alt_text, otherImages = [] } = image
    return {
        main : main,
        image_alt_text : (image_alt_text || title || subtitle || description || ""),
        otherImages : otherImages
    }
}

const getClassificationDataObjectByNode = ( node ) => {
    if(!node)
        return {
            serie : defaultSerie
        }
    let { classification = {}, serie = defaultSerie } = node.frontmatter
    classification.serie = classification.serie || serie
    classification.category = classification.category || 'Painting'
    classification.orientation = classification.orientation || getPaintOrientation(node)
    classification.composition = classification.composition || 'Single'
    classification.surface = classification.surface || 'Canvas'
    return classification
}

const getPaintOrientation = ( node ) => {
    const{ orientation } = node
    if(orientation)
        return orientation

    const sizes = getSizesGroupObjectByNode(node)
    if(!sizes || sizes.length == 0)
        return 'Free'
    
    let h = 0
    let w = 0;
    for(let i = 0; i < sizes.length; i++){
        let { cm } = sizes[i]
        let { height , width } = cm
        h += height
        w += width
    }
    if(h === w)
        return 'Square'
    if(h > w)
        return 'Portrait'
    return 'Landscape'
}

const getSizesGroupObjectByNode = ( node ) => {
    if(!node)
        return undefined
    const { sizes = [] } = node.frontmatter
    if(!Array.isArray(sizes))
        console.log("Definition error", node);
       
    if(sizes.length == 0)
        return undefined

    let ret = [];
    for(var i = 0; i < sizes.length; i++){
        let elem = getSizesGroupObjectByItem(sizes[i])
        if(elem)
            ret.push(elem)
    }
    return ret;
}

const getSizesGroupObjectByItem = ( item ) => {
    if(!item)
        return undefined
    const {cm , inch} = item 
    if(!cm && !inch)
        return undefined
    let cm_h = 0
    let cm_w = 0
    let cm_b = 0
    let inch_h = 0
    let inch_w = 0
    let inch_b = 0
    if(cm){
        cm_h = cm.height || 0
        cm_w = cm.width || 0
        cm_b = cm.breadth || 0
    }
    if(inch){
        inch_h = inch.height || 0
        inch_w = inch.width || 0
        inch_b = inch.breadth || 0
    }

    if(cm_b === 0 && inch_b === 0)
        cm_b = 3.5 // És l'estàndard que està fent servir

    const inchToCmRate = 2.54
    if(cm_h === 0 && inch_h > 0)
        cm_h = inch_h * inchToCmRate
    if(cm_w === 0 && inch_w > 0)
        cm_w = inch_w * inchToCmRate
    if(cm_b === 0 && inch_b > 0)
        cm_b = inch_b * inchToCmRate
    if(inch_h === 0 && cm_h > 0)
        inch_h = cm_h / inchToCmRate
    if(inch_w === 0 && cm_w > 0)
        inch_w = cm_w / inchToCmRate
    if(inch_b === 0 && cm_b > 0)
        inch_b = cm_b / inchToCmRate

    return {
        cm : {
            height : roundToTwo(cm_h),
            width : roundToTwo(cm_w),
            breadth : roundToTwo(cm_b)
        },
        inch : {
            height : roundToTwo(inch_h),
            width : roundToTwo(inch_w),
            breadth : roundToTwo(inch_b)
        }
    }
}

const getQuoteObjectByNode = ( node ) => {
    if(!node || !node.frontmatter || !node.frontmatter.quote)
        return undefined
    let { author = 'Unknown', text, showQuote = true } = node.frontmatter.quote
    if(showQuote && text === undefined)
        showQuote = false
    return { author, text, showQuote }
}

const getSeoTranslatedText = (id) => {
    //TODO: Retornar la traducció
    const seoLang = 'en'
    return getTranslatedText(id, seoLang)
}

const getTranslatedText = (id, lang) => {
    //TODO: Retornar la traducció
    const seoLang = 'en'
    return id
}

const getSeoObjectByNode = (node, classification = {}, type = 'Undefined') => {
    if(!node)
        return undefined
    const { serie = defaultSerie, title, subtitle, seo = {}, description, keywords = [], tags = [], image } = node.frontmatter;
    const { main : mainImage } = (image || {})
    const { category, technique, composition, surface, style, tags : _tags = [], serie : serieC } = (classification || {})

    const genericTags = ['abstract art']
    let _keywords = [...genericTags, ...keywords , ...tags, ..._tags]
    if(serie)
        _keywords.push(serie)
    if(serieC)
        _keywords.push(serieC)
    if(title)
        _keywords.push(title)
    if(subtitle)
        _keywords.push(subtitle)    
    if(category)
        _keywords.push(getSeoTranslatedText(category))
    if(technique)
        _keywords.push(getSeoTranslatedText(technique))
    if(composition)
        _keywords.push(getSeoTranslatedText(composition))
    if(surface)
        _keywords.push(getSeoTranslatedText(surface))
    if(style)
        _keywords.push(getSeoTranslatedText(style))

    _keywords = _keywords.filter((entry, index) => {
        if(!entry || entry === '')
            return false
        return _keywords.indexOf(entry) === index
    })

    let seoDescription = ''
    if(seo.description)
        seoDescription = seo.description
    else{
        switch(type){
            case 'Paint':
            case 'Serie':
            case 'PageText':
                //TODO: s'hauria de posar un text concret, però potser s'hauria de fer a través de les traduccions
                break;
        }
    }
    
    return {
        description : seoDescription || seo.description || description || subtitle || title,
        image : (seo ? seo.image : null) || mainImage,
        keywords : _keywords
    }
}

const getSellingDataByNode = ( node ) => {
    if(!node)
        return undefined
    let { sellingData = {} } = node.frontmatter
    let { priceDollar, priceEur, priceDollar : initPrizeDollar, showPrice = true } = sellingData
    let { productState = 'ForSale', showProductState} = sellingData

    const defaultEuroPrice = 1000
    const EuroToDollarRate = 1.15
    if(!priceDollar && priceEur > 0)
        priceDollar = priceEur * EuroToDollarRate

    if(!priceEur && priceDollar > 0)
        priceEur = priceDollar / EuroToDollarRate

    if(showProductState === undefined)
        showProductState = (productState === 'ForSale' || showPrice)

    sellingData.productState = productState
    sellingData.showProductState = showProductState
    sellingData.priceDollar = roundToTwo(priceDollar || (defaultEuroPrice * EuroToDollarRate))
    sellingData.priceEur = roundToTwo(priceEur || (defaultEuroPrice))
    sellingData.showPrice = showPrice
    return sellingData
}

const roundToTwo = (num) => {
    return +(Math.round(num + "e+2")  + "e-2");
}

// Les URL han de ser totes en minúscules i sense caràcters especials
const sanitizeUrl = (url) => {
    if(!url)
        return ""
    // S'eliminen els accents
    url = url.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return url.toLowerCase()
}

/**
 * CREATE RESOLVERS : definit per poder utilitzar els bodys de Mdx com a html
 */
exports.createResolvers = ({ createResolvers }) => {
    console.log("CreateResolvers")
    createResolvers({
        Paint: {
            body: {
                type: 'String',
                resolve: (source, args, context, info) => {
                    const type = info.schema.getType('Mdx');
                    const mdxFields = type.getFields();
                    const resolver = mdxFields.body.resolve;
        
                    const mdxNode = context.nodeModel.getNodeById({ id: source.parent });
        
                    return resolver(mdxNode, args, context, {
                        fieldName: 'body',
                    });
        
                }
            }
        },
        Serie: {
            body: {
                type: 'String',
                resolve: (source, args, context, info) => {
                    const type = info.schema.getType('Mdx');
                    const mdxFields = type.getFields();
                    const resolver = mdxFields.body.resolve;
        
                    const mdxNode = context.nodeModel.getNodeById({ id: source.parent });
        
                    return resolver(mdxNode, args, context, {
                        fieldName: 'body',
                    });
                }
            }
        },
        PageText: {
            body: {
                type: 'String',
                resolve: (source, args, context, info) => {
                    const type = info.schema.getType('Mdx');
                    const mdxFields = type.getFields();
                    const resolver = mdxFields.body.resolve;
        
                    const mdxNode = context.nodeModel.getNodeById({ id: source.parent });
        
                    return resolver(mdxNode, args, context, {
                        fieldName: 'body',
                    });
                }
            }
        }
    })
  }

/**
 * CREATE PAGES : creació de les pàgines a partir de consultes graphQL
 */
// Implement the Gatsby API “createPages”. This is called once the
// data layer is bootstrapped to let plugins create pages from data.
exports.createPages = async ({ graphql, actions, reporter }) => {
    const { createPage } = actions
    const createPaintPages = true

    const seriesQuery = await graphql(`
        query AllSeries {
            allSerie {
                nodes {
                    id
                    serie
                    hide
                }
            }
        }
        `)
    // Handle errors
    if (seriesQuery.errors) {
        reporter.panicOnBuild(`Error while running GraphQL query.`)
        return
    }

    const { data = {}}  = seriesQuery
    const { allSerie : allSeries = {} } = data
    const { nodes : allSerie = [] } = allSeries

    // Create pages for each markdown file.
    const isSerieHidden = (list, serie) => {
        if(list === undefined || list.length === 0)
            return false
        for(let i = 0; i < list.length; i++){
            let {serie : s1 = '', hide = false} = list[i]
            if(s1 === '')
                continue
            if(s1 === serie)
                return hide
        }
        return false;
    }

    let seriesTypes = []
    if(createPaintPages){
        const paintQuery = await graphql(`
            query AllPaints {
                allPaint {
                nodes {
                    id
                    url
                    title
                    breadcrumbs{
                        url,
                        text
                    }
                    classification {
                        serie
                    }
                }
                }
            }
            `)

        // Handle errors
        if (paintQuery.errors) {
            reporter.panicOnBuild(`Error while running GraphQL query.`)
            return
        }

        // Create pages for each markdown file.
        const paintTemplate = path.resolve(`./src/templates/paintDetailTemplate.js`)
        paintQuery.data.allPaint.nodes.forEach( node => {
            const { url, classification, breadcrumbs, hide } = node

            if(!hide){
                const { serie } = classification

                if(isSerieHidden(allSerie, serie)){
                    console.log("Paint hidden by serie", serie, url)
                }else{
                    if(!seriesTypes.includes(serie))
                        seriesTypes.push(serie)
                    createPage({
                        path : url,
                        component: paintTemplate,
                        context: {
                            url : url,
                            breadcrumbs : breadcrumbs
                        },
                    })    
                }

            }else{
                console.log("Paint hidden", url)
            }
        })
    }
    
    if(process.env.GATSBY_CREATE_GALLERY_SERIES){
        const seriesTemplate = path.resolve(`./src/templates/serieGalleryTemplate.js`)
        seriesTypes.forEach( serie => {  
            if(isSerieHidden(allSerie, serie)){
                console.log("Serie hidden", serie)
            }else{
                const breadcrumbs = calcBreadCrumbs(serie, null)
                let { url } = breadcrumbs[breadcrumbs.length - 1]
                createPage({
                    path : url,
                    component: seriesTemplate,
                    context: {
                        breadcrumbs : breadcrumbs,
                        serie : serie
                    },
                })
            }
        })
    }
}
