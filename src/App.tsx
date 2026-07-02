import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  BackgroundState,
  BadgeState,
  CanvasFormat,
  CreativeImages,
  CreativeState,
  FontKey,
  HeadlineState,
  PresetKey,
  ProfileState,
} from './types'
import { defaultState } from './state/defaults'
import { FONTS, FORMAT_DIMS, PRESETS } from './state/presets'
import { loadState, saveState } from './lib/persist'
import { fileToImage } from './lib/image'
import { slugifyHeadline, timestamp } from './lib/slug'
import { ensureFontsReady } from './render/fonts'
import { computeHeadlineLayout, computeRegions, renderCreative } from './render/renderCreative'
import { CanvasPreview } from './components/CanvasPreview'
import { AvatarCropModal } from './components/AvatarCropModal'
import { BackgroundSection } from './components/sections/BackgroundSection'
import { HeadlineSection } from './components/sections/HeadlineSection'
import { BadgeSection } from './components/sections/BadgeSection'
import { ProfileSection } from './components/sections/ProfileSection'
import { LayoutSection } from './components/sections/LayoutSection'
import { Button } from './components/ui/controls'

export function App() {
  const [fontsReady, setFontsReady] = useState(false)
  const [state, setState] = useState<CreativeState>(() => loadState())
  const [imagesVersion, setImagesVersion] = useState(0)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Runtime-only image handles.
  const imagesRef = useRef<CreativeImages>({ hero: null, avatar: null })
  // Original (uncropped) avatar source kept so the crop can be re-edited.
  const avatarSourceRef = useRef<HTMLImageElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const metricsCanvas = useMemo(() => document.createElement('canvas'), [])

  useEffect(() => {
    ensureFontsReady().then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    saveState(state)
  }, [state])

  const bumpImages = useCallback(() => setImagesVersion((v) => v + 1), [])

  const flashToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }, [])

  // --- Headline metrics (line count + auto font size) -------------------------
  const metrics = useMemo(() => {
    if (!fontsReady) return { lineCount: 0, autoFontSize: 0 }
    const ctx = metricsCanvas.getContext('2d')
    if (!ctx) return { lineCount: 0, autoFontSize: 0 }
    const dims = FORMAT_DIMS[state.format]
    const regions = computeRegions(state, dims)
    const layout = computeHeadlineLayout(ctx, state, regions.headline)
    return { lineCount: layout.lines.length, autoFontSize: layout.fontSize }
  }, [state, fontsReady, metricsCanvas])

  // --- State updaters ---------------------------------------------------------
  const patchBackground = useCallback(
    (patch: Partial<BackgroundState>) =>
      setState((s) => ({ ...s, background: { ...s.background, ...patch } })),
    [],
  )
  const patchHeadline = useCallback(
    (patch: Partial<HeadlineState>) =>
      setState((s) => ({ ...s, headline: { ...s.headline, ...patch } })),
    [],
  )
  const patchBadge = useCallback(
    (patch: Partial<BadgeState>) => setState((s) => ({ ...s, badge: { ...s.badge, ...patch } })),
    [],
  )
  const patchProfile = useCallback(
    (patch: Partial<ProfileState>) =>
      setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
    [],
  )

  const onPan = useCallback(
    (offsetX: number, offsetY: number) => patchBackground({ offsetX, offsetY }),
    [patchBackground],
  )
  const onZoom = useCallback(
    (zoom: number, offsetX: number, offsetY: number) =>
      patchBackground({ zoom, offsetX, offsetY }),
    [patchBackground],
  )

  const onPreset = useCallback((preset: PresetKey) => {
    const p = PRESETS[preset]
    setState((s) => ({
      ...s,
      style: { preset, font: p.font },
      headline: { ...s.headline, uppercase: p.uppercase, letterSpacing: p.letterSpacing },
    }))
  }, [])

  const onFont = useCallback(
    (font: FontKey) => setState((s) => ({ ...s, style: { ...s.style, font } })),
    [],
  )

  const onFormat = useCallback((format: CanvasFormat) => {
    setState((s) => {
      const from = FORMAT_DIMS[s.format]
      const to = FORMAT_DIMS[format]
      // Keep the pan relative when the canvas height changes.
      const ratioY = to.h / from.h
      return {
        ...s,
        format,
        background: { ...s.background, offsetY: s.background.offsetY * ratioY },
      }
    })
  }, [])

  // --- Image handling ---------------------------------------------------------
  const onHeroFile = useCallback(
    async (file: File) => {
      try {
        const img = await fileToImage(file)
        imagesRef.current.hero = img
        bumpImages()
        // Reset pan/zoom for the new image.
        patchBackground({ zoom: 1, offsetX: 0, offsetY: 0 })
      } catch {
        flashToast('Could not load that image')
      }
    },
    [bumpImages, patchBackground, flashToast],
  )

  const onCenter = useCallback(
    () => patchBackground({ offsetX: 0, offsetY: 0 }),
    [patchBackground],
  )

  const onConfirmAvatar = useCallback(
    (canvas: HTMLCanvasElement) => {
      imagesRef.current.avatar = canvas
      // Re-derive a source image so the modal can reopen with a photo.
      const src = new Image()
      src.src = canvas.toDataURL('image/png')
      avatarSourceRef.current = src
      setAvatarOpen(false)
      bumpImages()
    },
    [bumpImages],
  )

  const onRemoveAvatar = useCallback(() => {
    imagesRef.current.avatar = null
    avatarSourceRef.current = null
    bumpImages()
  }, [bumpImages])

  // --- Randomize placeholder --------------------------------------------------
  const randomize = useCallback(() => {
    imagesRef.current.hero = null
    imagesRef.current.avatar = null
    avatarSourceRef.current = null
    setState((s) => ({ ...defaultState(), format: s.format }))
    bumpImages()
    flashToast('Demo content loaded')
  }, [bumpImages, flashToast])

  // --- Export -----------------------------------------------------------------
  const renderToCanvas = useCallback((): HTMLCanvasElement | null => {
    const dims = FORMAT_DIMS[state.format]
    const canvas = document.createElement('canvas')
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    renderCreative(ctx, state, imagesRef.current, dims)
    return canvas
  }, [state])

  const onExport = useCallback(() => {
    const canvas = renderToCanvas()
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const name = `creative-${slugifyHeadline(state.headline.text)}-${timestamp()}.png`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      flashToast('PNG exported')
    }, 'image/png')
  }, [renderToCanvas, state.headline.text, flashToast])

  const onCopy = useCallback(async () => {
    const canvas = renderToCanvas()
    if (!canvas) return
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (!blob) throw new Error('no blob')
      const ClipboardItemCtor = window.ClipboardItem
      if (!ClipboardItemCtor || !navigator.clipboard?.write) {
        throw new Error('clipboard unsupported')
      }
      await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })])
      flashToast('Copied to clipboard')
    } catch {
      flashToast('Copy not supported — use Export')
    }
  }, [renderToCanvas, flashToast])

  if (!fontsReady) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        Loading fonts…
      </div>
    )
  }

  const images = imagesRef.current

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left: preview */}
      <div className="flex flex-1 flex-col items-center gap-5 overflow-auto bg-zinc-950 p-6">
        <header className="flex w-full max-w-[560px] items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Breaking News</h1>
            <p className="text-xs text-zinc-500">Ad creative generator</p>
          </div>
          <Button onClick={randomize}>Randomize placeholder</Button>
        </header>

        <div className="flex w-full max-w-[560px] justify-center">
          <CanvasPreview
            state={state}
            images={images}
            imagesVersion={imagesVersion}
            onPan={onPan}
            onZoom={onZoom}
            registerCanvas={(el) => {
              previewCanvasRef.current = el
            }}
          />
        </div>

        <div className="flex w-full max-w-[560px] gap-3">
          <div className="flex-1">
            <Button variant="primary" onClick={onExport}>
              Export PNG
            </Button>
          </div>
          <Button onClick={onCopy}>Copy to clipboard</Button>
        </div>
        <p className="text-[11px] text-zinc-600">
          {FORMAT_DIMS[state.format].w}×{FORMAT_DIMS[state.format].h} · {metrics.lineCount} line
          {metrics.lineCount === 1 ? '' : 's'} · font {metrics.autoFontSize}px ({FONTS[state.style.font].label})
        </p>
      </div>

      {/* Right: controls */}
      <aside className="w-full shrink-0 overflow-auto border-l border-white/8 bg-zinc-900/60 lg:w-[380px]">
        <BackgroundSection
          bg={state.background}
          hasImage={images.hero != null}
          onChange={patchBackground}
          onFile={onHeroFile}
          onCenter={onCenter}
        />
        <HeadlineSection
          headline={state.headline}
          lineCount={metrics.lineCount}
          autoFontSize={metrics.autoFontSize}
          onChange={patchHeadline}
        />
        <BadgeSection badge={state.badge} onChange={patchBadge} />
        <ProfileSection
          profile={state.profile}
          hasAvatar={images.avatar != null}
          onChange={patchProfile}
          onEditAvatar={() => setAvatarOpen(true)}
          onRemoveAvatar={onRemoveAvatar}
        />
        <LayoutSection
          style={state.style}
          format={state.format}
          onPreset={onPreset}
          onFont={onFont}
          onFormat={onFormat}
        />
      </aside>

      {avatarOpen && (
        <AvatarCropModal
          initialImage={avatarSourceRef.current}
          onCancel={() => setAvatarOpen(false)}
          onConfirm={onConfirmAvatar}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
