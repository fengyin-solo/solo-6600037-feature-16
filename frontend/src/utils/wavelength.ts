// 波长 -> 可见光颜色映射（与原 App.vue 中的分段映射保持一致）
// 可见光边界外、颜色映射失败或空数据时统一回退到安全色 SAFE_COLOR

export interface RGB {
  r: number
  g: number
  b: number
}

/** 安全回退色：slate-400，在深色/黑色背景上均清晰可见 */
export const SAFE_COLOR: RGB = { r: 148, g: 163, b: 184 } // #94a3b8

export const VISIBLE_MIN = 380 // nm
export const VISIBLE_MAX = 780 // nm

export interface ColorBand {
  name: string
  start: number // nm, 含
  end: number // nm, 不含（最后一个区间含上界）
}

/** 与映射分段一致的颜色区间（可见光连续谱） */
export const COLOR_BANDS: ColorBand[] = [
  { name: '紫色', start: 380, end: 440 },
  { name: '蓝紫色', start: 440, end: 490 },
  { name: '青色', start: 490, end: 510 },
  { name: '绿色', start: 510, end: 580 },
  { name: '黄色', start: 580, end: 645 },
  { name: '红色', start: 645, end: 780 },
]

/** 光谱色标渐变取样点（即各分段边界） */
const STOP_WAVELENGTHS = [380, 440, 490, 510, 580, 645, 780]

export function isValidWavelength(nm: number): boolean {
  return typeof nm === 'number' && Number.isFinite(nm) && nm >= VISIBLE_MIN && nm <= VISIBLE_MAX
}

function clone(c: RGB): RGB {
  return { r: c.r, g: c.g, b: c.b }
}

/**
 * 波长(nm) -> RGB。
 * 边界外或映射结果异常时回退安全色；亮度（各视图中的 alpha）不由本函数决定。
 */
export function wavelengthToRGB(nm: number): RGB {
  if (!isValidWavelength(nm)) return clone(SAFE_COLOR)

  let r = 0
  let g = 0
  let b = 0
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60
    b = 1.0
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / 50
    b = 1.0
  } else if (nm >= 490 && nm < 510) {
    g = 1.0
    b = -(nm - 510) / 20
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / 70
    g = 1.0
  } else if (nm >= 580 && nm < 645) {
    r = 1.0
    g = -(nm - 645) / 65
  } else if (nm >= 645 && nm <= 780) {
    r = 1.0
  }

  const out: RGB = {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }

  // 颜色映射失败兜底：分量越界或非有限值
  if (![out.r, out.g, out.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) {
    return clone(SAFE_COLOR)
  }
  return out
}

/** 返回波长所属颜色区间；可见光边界外返回 null */
export function getColorBand(nm: number): ColorBand | null {
  if (!isValidWavelength(nm)) return null
  const found = COLOR_BANDS.find((band) => nm >= band.start && nm < band.end)
  return found ?? COLOR_BANDS[COLOR_BANDS.length - 1] // nm === 780 归入红色区间
}

export function rgbCss(c: RGB, alpha = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`
}

export function rgbHex(c: RGB): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
}

/** 可见光连续谱的 CSS 线性渐变（用于光谱色标） */
export function spectrumGradientCss(): string {
  const stops = STOP_WAVELENGTHS.map((w) => {
    const c = wavelengthToRGB(w)
    const pct = (((w - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN)) * 100).toFixed(2)
    return `${rgbCss(c)} ${pct}%`
  })
  return `linear-gradient(to right, ${stops.join(',')})`
}

/** 波长在色标上的百分比位置，边界外夹取到 [0,100] */
export function wavelengthMarkerPercent(nm: number): number {
  const pct = ((nm - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN)) * 100
  return Math.min(100, Math.max(0, pct))
}
