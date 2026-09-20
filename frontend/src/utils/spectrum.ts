// 波长 → 颜色映射与光谱色标配置
// 可见光范围 380–780 nm；边界外、映射失败或空数据时回退安全色

export const VISIBLE_MIN = 380
export const VISIBLE_MAX = 780

/** 安全色：可见光边界外 / 颜色映射失败 / 空数据时的回退色 */
export const SAFE_RGB: [number, number, number] = [148, 163, 184]

export function isVisibleWavelength(nm: number): boolean {
  return Number.isFinite(nm) && nm >= VISIBLE_MIN && nm <= VISIBLE_MAX
}

function safeColor(): [number, number, number] {
  return [SAFE_RGB[0], SAFE_RGB[1], SAFE_RGB[2]]
}

/** 波长(nm) → RGB。超出可见光范围或映射失败（NaN/分量越界）时返回安全色 */
export function wavelengthToRGB(nm: number): [number, number, number] {
  if (!isVisibleWavelength(nm)) return safeColor()
  let r = 0, g = 0, b = 0
  if (nm < 440) { r = -(nm - 440) / 60; b = 1.0 }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1.0 }
  else if (nm < 510) { g = 1.0; b = -(nm - 510) / 20 }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1.0 }
  else if (nm < 645) { r = 1.0; g = -(nm - 645) / 65 }
  else { r = 1.0 }
  const rgb: [number, number, number] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  if (rgb.some(v => !Number.isFinite(v) || v < 0 || v > 255)) return safeColor()
  return rgb
}

export interface SpectrumBand {
  min: number
  max: number
  name: string
  rgb: [number, number, number]
}

/** 光谱颜色区间（分段与 wavelengthToRGB 一致，色块取区间中点） */
export const SPECTRUM_BANDS: SpectrumBand[] = [
  { min: 380, max: 440, name: '紫' },
  { min: 440, max: 490, name: '蓝' },
  { min: 490, max: 510, name: '青' },
  { min: 510, max: 580, name: '绿' },
  { min: 580, max: 645, name: '黄橙' },
  { min: 645, max: 780, name: '红' },
].map(b => ({ ...b, rgb: wavelengthToRGB((b.min + b.max) / 2) }))

const SPECTRUM_LAST_BAND = SPECTRUM_BANDS[SPECTRUM_BANDS.length - 1]

/** 波长所属的颜色区间；超出可见光范围返回 null */
export function bandOf(nm: number): SpectrumBand | null {
  if (!isVisibleWavelength(nm)) return null
  return SPECTRUM_BANDS.find(b => nm >= b.min && nm < b.max) ?? SPECTRUM_LAST_BAND
}

export function rgbCss(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

export function rgbHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('')
}
