import antonUrl from '../assets/fonts/anton-400.woff2'
import archivoUrl from '../assets/fonts/archivo-black-400.woff2'
import bebasUrl from '../assets/fonts/bebas-neue-400.woff2'
import interUrl from '../assets/fonts/inter-var.woff2'
import poppins600Url from '../assets/fonts/poppins-600.woff2'
import poppins700Url from '../assets/fonts/poppins-700.woff2'

interface FaceSpec {
  family: string
  url: string
  descriptors: FontFaceDescriptors
}

/**
 * All display faces are self-hosted (bundled woff2) so the canvas never depends
 * on a runtime CDN and never falls back to a system font. Inter is a variable
 * font — one file serves every weight we request.
 */
const FACES: FaceSpec[] = [
  { family: 'Anton', url: antonUrl, descriptors: { weight: '400' } },
  { family: 'Archivo Black', url: archivoUrl, descriptors: { weight: '400' } },
  { family: 'Bebas Neue', url: bebasUrl, descriptors: { weight: '400' } },
  { family: 'Inter', url: interUrl, descriptors: { weight: '100 900' } },
  { family: 'Poppins', url: poppins600Url, descriptors: { weight: '600' } },
  { family: 'Poppins', url: poppins700Url, descriptors: { weight: '700' } },
]

let readyPromise: Promise<void> | null = null

/**
 * Load and register every display face before first render. Resolves once all
 * faces are added to `document.fonts`, or after a safety timeout so a single
 * failed fetch can never permanently block the UI.
 */
export function ensureFontsReady(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = (async () => {
    const loadAll = Promise.all(
      FACES.map(async (spec) => {
        try {
          const face = new FontFace(spec.family, `url(${spec.url}) format('woff2')`, spec.descriptors)
          await face.load()
          document.fonts.add(face)
        } catch {
          // Non-fatal: a missing face falls back gracefully.
        }
      }),
    ).then(() => undefined)

    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 5000))
    await Promise.race([loadAll, timeout])
  })()

  return readyPromise
}
