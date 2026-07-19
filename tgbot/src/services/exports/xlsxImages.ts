import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import JSZip from 'jszip'

export type WorksheetImage = {
  sheetNumber: number
  drawingNumber: number
  imageNumber: number
  name: string
  png: Buffer
  column: number
  columnOffsetPixels: number
  row: number
  rowOffsetPixels: number
  widthPixels: number
  heightPixels: number
}

const RELATIONSHIPS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const OFFICE_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const DRAWING_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.drawing+xml'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function nextRelationshipId(xml: string) {
  const ids = [...xml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]))
  return `rId${Math.max(0, ...ids) + 1}`
}

function appendRelationship(xml: string, relationship: string) {
  return xml.replace('</Relationships>', `${relationship}</Relationships>`)
}

function drawingXml(image: WorksheetImage) {
  const emuPerPixel = 9_525
  const columnOffset = Math.round(image.columnOffsetPixels * emuPerPixel)
  const rowOffset = Math.round(image.rowOffsetPixels * emuPerPixel)
  const width = Math.round(image.widthPixels * emuPerPixel)
  const height = Math.round(image.heightPixels * emuPerPixel)

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:oneCellAnchor editAs="oneCell"><xdr:from><xdr:col>${image.column}</xdr:col><xdr:colOff>${columnOffset}</xdr:colOff><xdr:row>${image.row}</xdr:row><xdr:rowOff>${rowOffset}</xdr:rowOff></xdr:from><xdr:ext cx="${width}" cy="${height}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="${escapeXml(image.name)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="${OFFICE_REL_NS}" r:embed="rId1" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`
}

export async function embedWorksheetImages(
  sourcePath: string,
  outputPath: string,
  images: WorksheetImage[],
) {
  const zip = await JSZip.loadAsync(await readFile(sourcePath))
  const contentTypesFile = zip.file('[Content_Types].xml')
  if (!contentTypesFile) throw new Error('XLSX content types are missing')
  let contentTypes = await contentTypesFile.async('string')
  if (!contentTypes.includes('Extension="png"')) {
    contentTypes = contentTypes.replace(
      '</Types>',
      '<Default Extension="png" ContentType="image/png"/></Types>',
    )
  }

  for (const image of images) {
    const sheetPath = `xl/worksheets/sheet${image.sheetNumber}.xml`
    const sheetFile = zip.file(sheetPath)
    if (!sheetFile) throw new Error(`XLSX worksheet ${image.sheetNumber} is missing`)
    let sheetXml = await sheetFile.async('string')

    const sheetRelationshipsPath = `xl/worksheets/_rels/sheet${image.sheetNumber}.xml.rels`
    const sheetRelationshipsFile = zip.file(sheetRelationshipsPath)
    let sheetRelationships = sheetRelationshipsFile
      ? await sheetRelationshipsFile.async('string')
      : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${RELATIONSHIPS_NS}"></Relationships>`
    const drawingRelationshipId = nextRelationshipId(sheetRelationships)
    sheetRelationships = appendRelationship(
      sheetRelationships,
      `<Relationship Id="${drawingRelationshipId}" Type="${OFFICE_REL_NS}/drawing" Target="../drawings/drawing${image.drawingNumber}.xml"/>`,
    )
    zip.file(sheetRelationshipsPath, sheetRelationships)

    if (!sheetXml.includes('xmlns:r=')) {
      sheetXml = sheetXml.replace(
        '<worksheet ',
        `<worksheet xmlns:r="${OFFICE_REL_NS}" `,
      )
    }
    sheetXml = sheetXml.replace(
      '</worksheet>',
      `<drawing r:id="${drawingRelationshipId}"/></worksheet>`,
    )
    zip.file(sheetPath, sheetXml)

    zip.file(`xl/media/image${image.imageNumber}.png`, image.png)
    zip.file(`xl/drawings/drawing${image.drawingNumber}.xml`, drawingXml(image))
    zip.file(
      `xl/drawings/_rels/drawing${image.drawingNumber}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${RELATIONSHIPS_NS}"><Relationship Id="rId1" Type="${OFFICE_REL_NS}/image" Target="../media/image${image.imageNumber}.png"/></Relationships>`,
    )
    contentTypes = contentTypes.replace(
      '</Types>',
      `<Override PartName="/xl/drawings/drawing${image.drawingNumber}.xml" ContentType="${DRAWING_CONTENT_TYPE}"/></Types>`,
    )
  }

  zip.file('[Content_Types].xml', contentTypes)
  await pipeline(
    zip.generateNodeStream({
      type: 'nodebuffer',
      streamFiles: true,
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    }),
    createWriteStream(outputPath),
  )
}
