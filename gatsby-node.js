const path = require("path")
const get = require("lodash.get")
const QRCode = require("qrcode")

const defaultSerie = 'Miscellany'
/**
 * CREATE SCHEDMA : Definició dels tipus de GraphQL
 */
exports.createSchemaCustomization = ({ actions }) => {
    actions.createTypes(`
        interface SerieInterface implements Node{
            id: ID!
            url : String!
            qrCode: String @createQRCode(fieldName: "url")
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
            wallLabelDescription : String
            body: String
            lastModificationDate: Date @dateformat
        }

        type Serie implements Node & SerieInterface @dontInfer{
            id: ID!
            url : String!
            qrCode: String @createQRCode(fieldName: "url")
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
            wallLabelDescription : String
            body: String
            lastModificationDate: Date @dateformat
        }

        interface PaintInterface implements Node{
            id: ID!
            url : String!
            qrCode: String @createQRCode(fieldName: "url")
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
            wallLabelDescription : String
            body: String
            sellingData : SellingData
            lastModificationDate: Date @dateformat
        }

        type Paint implements Node & PaintInterface @dontInfer{
            id: ID!
            url : String!
            qrCode: String @createQRCode(fieldName: "url")
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
            wallLabelDescription : String
            body: String
            sellingData : SellingData
            lastModificationDate: Date @dateformat
        }

        interface PageTextInterface implements Node{
            id: ID!
            reference : String
            seo : Seo
            image : ImageGroup
            paragraphs : [ Paragraph ]
            sortParagraphs : SortValues
            body: String
            lastModificationDate: Date @dateformat
        }

        type PageText implements Node & PageTextInterface @dontInfer{
            id: ID!
            reference : String
            seo : Seo
            image : ImageGroup
            paragraphs : [ Paragraph ]
            sortParagraphs : SortValues
            body: String
            lastModificationDate: Date @dateformat
        }

        type Mdx implements Node{
            formatter : MdxFrontmatter!
        }

        type MdxFrontmatter{
            reference : String
            hide : Boolean
            url : String
            qrCode: String @createQRCode(fieldName: "url")
            date : Date
            order : Int
            productState : ProductStatesEnum
            image : ImageGroup
            breadcrumbs : [ BreadCrumb ]
            description : String
            wallLabelDescription : String
            body: String
            seo : Seo
            quote : Quote
            sizes : [ SizesGroup ]
            classification : ClassificationData
            sellingData : SellingData
            paragraphs : [ Paragraph ]
            sortParagraphs : SortValues
            lastModificationDate: Date @dateformat
        }

        type Paragraph {
            title : String
            subtitle : String
            text : String!
            sortText : String
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

        enum SortValues {
            ASC,
            DESC
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

        type QRCodeImage {
            url: String!
            dataUri: String!
          }
    `)

    actions.createFieldExtension({
        name: "createQRCode",
        args: {
          fieldName: "String!",
        },
        extend({ fieldName }) {
          return {
            resolve: createQRCode(fieldName),
          }
        },
    })
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

const createQRCode = (fieldName) => async (source) => {
    
    const _url = getSiteURL() + source.url 
    
    let qrCode = ``
    try {
      qrCode = await QRCode.toDataURL(_url, { scale: 6 })
    } catch (err) {
      console.error(err)
    }

    return qrCode
  }

exports.onCreateNode = async ({ node, getNode, actions, createNodeId }) => {
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
        let { reference, sortParagraphs } = node.frontmatter;
        if(!reference){
            const patternName = /([\w\d_-]*)\.?[^\\\/]*$/i;
            reference = fileAbsolutePath.match(patternName)[1]
        }
        if(!sortParagraphs)
            sortParagraphs = "DESC"
        //console.log(reference, node)
        actions.createNode({
            id: createNodeId(`PageText-${node.id}`),
            reference : reference,
            seo : getSeoObjectByNode(node, null, 'PageText'),
            image : getImageObjectByNode(node),
            paragraphs : getParagraphsObjectByNode(node),
            sortParagraphs : sortParagraphs,
            lastModificationDate : getLastModificationDateByNode(node),
            body : node.body,
            internal : {
                type : 'PageText',
                contentDigest : node.internal.contentDigest
            }
        })
    }else if(isSerie){
        console.log("Serie", fileAbsolutePath)
        //Node de pintures
        const { serie = defaultSerie, pageName, hide = false, reference } = node.frontmatter;
        if(!serie)
            return;
        //Sense ordenar per series
        const _serie = serie || pageName
        const urlRef = sanitizeUrl(_serie || reference || pageName)
        const _url = `/${urlRef}/`
        const _breadcrumbs = calcBreadCrumbs(_serie, null)
        const _classification= getClassificationDataObjectByNode(node)
        const _qrCode = ''//await createQRCode(_url)
        actions.createNode({
            id: createNodeId(`Serie-${node.id}`),
            hide : hide,
            url : _url,
            qrCode: _qrCode,
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
            wallLabelDescription : node.frontmatter.wallLabelDescription || node.frontmatter.description,
            lastModificationDate : getLastModificationDateByNode(node),
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
        console.log("Paint", parentNode.relativeDirectory, defaultUrl)
        const _pageName = (_reference || defaultUrl)
        const urlRef = sanitizeUrl(url || _pageName)
        //console.log(node.frontmatter.title, urlRef, parentNode.relativeDirectory, defaultUrl)

        //Sense ordenar per series
        /*const _url = process.env.GATSBY_CREATE_GALLERY_SERIES ? 
            '/gallery/' +  serie.toLowerCase() + '/'+ urlRef :    
            '/gallery/' +  urlRef*/
        const _url = sanitizeUrl(`/item/${urlRef}/`)
        const _breadcrumbs = calcBreadCrumbs(serie, _pageName)
        const _classification = getClassificationDataObjectByNode(node)
       
        /*let _qrCode = ''
        
        await createQRCode(_url)(function(err, url, data){
            console.log("Result createQRCode", err, url, data)
            _qrCode = url
        })*/

        actions.createNode({
            id: createNodeId(`Paint-${node.id}`),
            hide : hide,
            url : _url,
            //qrCode : _qrCode,
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
            wallLabelDescription : node.frontmatter.wallLabelDescription || node.frontmatter.description,
            body : node.body,
            sellingData : getSellingDataByNode(node),
            lastModificationDate : getLastModificationDateByNode(node),
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
const getLastModificationDateByNode = (node) => {
    let lastMod = new Date()
    try{
        const { lastModificationDate } = node.frontmatter
        if(lastModificationDate instanceof Date)
            lastMod = lastModificationDate
    }catch(error){
        
    }finally{
        return lastMod
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

const getParagraphsObjectByNode = (node) => {
    if(!node || !node.frontmatter)
        return undefined
    const { paragraphs } = node.frontmatter
    if(!paragraphs || paragraphs.length === 0)
        return paragraphs
    let ps = [];
    for(let i = 0; i < paragraphs.length; i++){
        const p = getParagraphObject(paragraphs[i], i)
        if(p)
            ps.push(p);
    }
    return ps;
}

const getParagraphObject = (paragraph, index) => {
    if(!paragraph)
        return null;
    let p = paragraph;
    if(!p.sortText){
        let indexText = String(index).padStart(4,'0')
        p.sortText =`sort-${indexText}`
    }
        
    return p   
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

const getSiteURL = (data) => {
    if(process.env.GATSBY_SITE_URL)
        return process.env.GATSBY_SITE_URL
    if(data && data.site && data.site.siteMetadata){
        if(data.site.lastModification)
        return data.site.lastModification
        if(data.site.siteMetadata.url)
        return data.site.siteMetadata.url
    }
    return "https://www.carinamiras.art"
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
                    lastModificationDate
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

    const getLastModificationSerieDate = (serie, nodes, lastModificationPaintSerieDate) => {
        if(serie === undefined)
            return null 
        const paintsDate = lastModificationPaintSerieDate[ serie ]
        if(nodes !== undefined){
            for(let i = 0; i < nodes.length; i++){
                if(nodes[i].serie !== serie)
                    continue
                if(paintsDate !== undefined && paintsDate < nodes[i].lastModificationDate )
                    return paintsDate
                return nodes[i].lastModificationDate
            }
        }
        return paintsDate
    }

    const siteQuery = await graphql(`
            query siteQuery {
                site {
                    siteMetadata {
                        siteUrl
                    }
                }
            }
            `)
    
    const siteUrl = getSiteURL(siteQuery)

    let seriesTypes = []
    let oldestModifiedPaintsSerieDate = []
    if(createPaintPages){
        const paintQuery = await graphql(`
            query AllPaints {
                allPaint {
                    nodes {
                        id
                        url
                        title
                        lastModificationDate
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
            const { id, reference, url, classification, breadcrumbs, hide, lastModificationDate } = node
            const { serie } = classification

            const serieDate = oldestModifiedPaintsSerieDate[ serie ] 
            if(serieDate === undefined || serieDate > lastModificationDate)
                oldestModifiedPaintsSerieDate[ serie ] = lastModificationDate

            if(!hide){
                if(isSerieHidden(allSerie, serie)){
                    console.log("Paint hidden by serie", serie, url)
                }else{
                    if(!seriesTypes.includes(serie))
                        seriesTypes.push(serie)
                    
                        createPage({
                        path : url,
                        component: paintTemplate,
                        context: {
                            id : id,
                            url : siteUrl + url,
                            reference : reference,
                            breadcrumbs : breadcrumbs,
                            serie : serie,
                            type : 'Paint',
                            lastModificationDate : lastModificationDate
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
                const lastModificationDate = getLastModificationSerieDate(serie, seriesQuery.data.allSerie.nodes, oldestModifiedPaintsSerieDate)

                createPage({
                    path : url,
                    component: seriesTemplate,
                    context: {
                        url : siteUrl + url,
                        reference : serie, 
                        breadcrumbs : breadcrumbs,
                        serie : serie,
                        type: 'Serie',
                        lastModificationDate : lastModificationDate
                    },
                })
            }
        })
    }
}
