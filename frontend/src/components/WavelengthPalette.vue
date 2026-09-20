<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-4">
    <h3 class="text-sm font-bold text-slate-400">波长配色视图</h3>

    <!-- 光谱色标 -->
    <div>
      <div class="relative mt-4">
        <div class="h-4 rounded" :style="{ background: spectrumGradient }"></div>
        <div class="absolute -top-3 -translate-x-1/2 text-[10px] leading-none"
          :style="{ left: markerLeft + '%', color: rgbCss(currentRGB) }">▼</div>
        <div class="absolute top-0 h-4 w-px bg-white/80 -translate-x-1/2" :style="{ left: markerLeft + '%' }"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{{ VISIBLE_MIN }}</span><span>{{ VISIBLE_MAX }}</span>
      </div>
      <!-- 颜色区间 -->
      <div class="flex flex-wrap gap-1 mt-2">
        <span v-for="band in SPECTRUM_BANDS" :key="band.name"
          :class="['flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]',
            currentBand && band.name === currentBand.name ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-400']">
          <i class="w-2 h-2 rounded-full inline-block" :style="{ background: rgbCss(band.rgb) }"></i>
          {{ band.name }} {{ band.min }}–{{ band.max }}
        </span>
      </div>
      <!-- 当前光谱颜色 / 图样波长色 -->
      <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-500 mb-1">当前光谱颜色</div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded border border-slate-600 shrink-0" :style="{ background: rgbCss(currentRGB) }"></span>
            <div>
              <div class="text-slate-200">λ = {{ store.params.wavelength }} nm</div>
              <div class="text-slate-500 font-mono">{{ rgbHex(currentRGB) }}<span v-if="currentBand" class="font-sans"> · {{ currentBand.name }}光</span></div>
            </div>
          </div>
        </div>
        <div class="bg-slate-900 rounded p-2">
          <div class="text-slate-500 mb-1">图样采用的波长色</div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded border border-slate-600 shrink-0" :style="{ background: rgbCss(patternRGB) }"></span>
            <div>
              <div class="text-slate-200 font-mono">{{ rgbHex(patternRGB) }}</div>
              <div class="text-slate-500">{{ patternNote }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="fallbackNote" class="mt-2 text-xs text-amber-400">⚠ {{ fallbackNote }}</div>
    </div>

    <!-- 三类实验配色对照 -->
    <div>
      <h4 class="text-xs font-bold text-slate-500 mb-2">三类实验配色对照</h4>
      <div class="space-y-1.5">
        <div v-for="exp in compareList" :key="exp.id"
          :class="['flex items-center gap-2 p-1.5 rounded border text-xs',
            store.currentExperiment === exp.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700']">
          <span class="w-20 shrink-0" :class="store.currentExperiment === exp.id ? 'text-cyan-300' : 'text-slate-400'">
            {{ exp.name }}<span v-if="store.currentExperiment === exp.id" class="text-cyan-500"> ●</span>
          </span>
          <span class="h-3 flex-1 rounded" :style="{ background: exp.strip }"></span>
          <span class="w-4 h-4 rounded border border-slate-600 shrink-0" :style="{ background: rgbCss(exp.rgb) }"></span>
          <span class="font-mono text-slate-500 w-16 shrink-0">{{ rgbHex(exp.rgb) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOpticsStore } from '../store/optics'
import {
  VISIBLE_MIN, VISIBLE_MAX, SAFE_RGB, SPECTRUM_BANDS,
  isVisibleWavelength, wavelengthToRGB, bandOf, rgbCss, rgbHex,
} from '../utils/spectrum'

const store = useOpticsStore()

const hasData = computed(() => store.intensityData.length > 0)

/** 当前光谱颜色：边界外或映射失败时已是安全色 */
const currentRGB = computed(() => wavelengthToRGB(store.params.wavelength))

/** 图样实际采用的波长色：空数据时图样不渲染，回退安全色 */
const patternRGB = computed<[number, number, number]>(() =>
  hasData.value ? currentRGB.value : [SAFE_RGB[0], SAFE_RGB[1], SAFE_RGB[2]])

const currentBand = computed(() => bandOf(store.params.wavelength))

const patternNote = computed(() => hasData.value ? '与图样渲染一致' : '空数据 · 安全色')

const fallbackNote = computed(() => {
  if (!isVisibleWavelength(store.params.wavelength)) {
    return `波长超出可见光范围（${VISIBLE_MIN}–${VISIBLE_MAX} nm），已回退安全色`
  }
  if (!hasData.value) return '暂无光强数据，图样波长色已回退安全色'
  return ''
})

/** 光谱色标渐变（每 10 nm 取一个色标） */
const spectrumGradient = computed(() => {
  const stops: string[] = []
  for (let nm = VISIBLE_MIN; nm <= VISIBLE_MAX; nm += 10) {
    const pct = ((nm - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN) * 100).toFixed(1)
    stops.push(`${rgbCss(wavelengthToRGB(nm))} ${pct}%`)
  }
  return `linear-gradient(90deg, ${stops.join(',')})`
})

/** 当前波长在色标上的位置（越界时钳制到端点） */
const markerLeft = computed(() => {
  const nm = store.params.wavelength
  const clamped = Math.min(VISIBLE_MAX, Math.max(VISIBLE_MIN, Number.isFinite(nm) ? nm : VISIBLE_MIN))
  return (clamped - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN) * 100
})

/** 三类实验配色对照：同一波长色，条纹样式按实验区分 */
const compareList = computed(() => {
  const rgb = patternRGB.value
  const c = rgbCss(rgb)
  return [
    { id: 'double', name: '双缝干涉', rgb, strip: `repeating-linear-gradient(90deg, #000 0, ${c} 3px, #000 6px)` },
    { id: 'single', name: '单缝衍射', rgb, strip: `linear-gradient(90deg, #000, ${c} 40%, ${c} 60%, #000)` },
    { id: 'newton', name: '牛顿环', rgb, strip: `repeating-radial-gradient(circle at 50% 50%, ${c} 0, #000 4px, ${c} 6px, #000 10px)` },
  ]
})
</script>
