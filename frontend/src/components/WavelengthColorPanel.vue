<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <h3 class="text-sm font-bold text-slate-400 mb-1">波长配色视图</h3>
    <p class="text-[11px] text-slate-500 mb-3">颜色随波长 λ 变化；图样明暗仍由光强计算决定</p>

    <!-- 光谱色标 -->
    <div class="mb-1 flex justify-between text-[10px] text-slate-500">
      <span>380nm</span><span>440</span><span>490</span><span>510</span><span>580</span><span>645</span><span>780nm</span>
    </div>
    <div class="relative h-5 rounded overflow-hidden border border-slate-700" :style="{ background: gradient }">
      <div class="absolute top-0 bottom-0 w-0.5 bg-white/90 border-l border-r border-black/40"
        :style="{ left: markerPercent + '%' }"></div>
      <div class="absolute -top-0.5 w-2 h-2 rotate-45 bg-white" :style="{ left: 'calc(' + markerPercent + '% - 3px)' }"></div>
    </div>
    <div class="flex h-4 mt-0.5 text-[9px] text-slate-500">
      <div v-for="band in bands" :key="band.name" class="text-center overflow-hidden whitespace-nowrap"
        :style="{ width: bandWidth(band) + '%' }">
        {{ band.name }}
      </div>
    </div>

    <!-- 当前光谱颜色 / 颜色区间 / 图样采用的波长色 -->
    <div class="grid grid-cols-3 gap-2 mt-2">
      <div class="bg-slate-900 rounded p-2 text-center">
        <div class="h-8 rounded border border-slate-700 mb-1" :style="{ background: colorCss }"></div>
        <div class="text-[10px] text-slate-500">当前光谱颜色</div>
        <div class="text-[10px] text-slate-300 font-bold">{{ colorHex }}</div>
      </div>
      <div class="bg-slate-900 rounded p-2 text-center">
        <div class="h-8 rounded border border-slate-700 mb-1 flex items-center justify-center text-[11px] font-bold"
          :style="band ? { background: colorCss, color: bandTextColor } : { background: safeHex, color: '#0f172a' }">
          {{ band ? band.name : '安全色' }}
        </div>
        <div class="text-[10px] text-slate-500">颜色区间</div>
        <div class="text-[10px] text-slate-300 font-bold">{{ band ? band.start + '–' + band.end + 'nm' : '380–780nm' }}</div>
      </div>
      <div class="bg-slate-900 rounded p-2 text-center">
        <div class="h-8 rounded border border-slate-700 mb-1 bg-black flex items-center justify-center">
          <span class="w-3 h-3 rounded-full" :style="{ background: colorCss, boxShadow: '0 0 6px ' + colorCss }"></span>
        </div>
        <div class="text-[10px] text-slate-500">图样采用波长色</div>
        <div class="text-[10px]" :class="isValid ? 'text-slate-300 font-bold' : 'text-amber-400 font-bold'">
          {{ isValid ? 'RGB(' + color.r + ',' + color.g + ',' + color.b + ')' : '回退安全色' }}
        </div>
      </div>
    </div>

    <!-- 回退提示 -->
    <div v-if="!isValid" class="mt-2 text-[11px] text-amber-400 bg-amber-900/20 border border-amber-800 rounded p-2">
      ⚠ λ = {{ store.params.wavelength }}nm 超出可见光边界（380–780nm），已回退安全色 {{ safeHex }}
    </div>
    <div v-else-if="emptyData" class="mt-2 text-[11px] text-amber-400 bg-amber-900/20 border border-amber-800 rounded p-2">
      ⚠ 当前图样数据为空，画布以安全色 {{ safeHex }} 占位，计算结果不受影响
    </div>

    <!-- 三类实验配色对照 -->
    <div class="mt-3">
      <div class="text-[11px] text-slate-500 mb-2">三类实验配色对照（同一 λ 下颜色一致，点击可切换实验）</div>
      <div class="space-y-1">
        <button v-for="exp in experiments" :key="exp.id" @click="store.setExperiment(exp.id)"
          :class="['w-full flex items-center gap-2 p-2 rounded border text-xs transition-all text-left',
            store.currentExperiment === exp.id
              ? 'border-cyan-500 bg-cyan-900/30'
              : 'border-slate-700 bg-slate-900 hover:border-slate-500']">
          <span class="w-20 truncate" :class="store.currentExperiment === exp.id ? 'text-cyan-400 font-bold' : 'text-slate-300'">
            {{ exp.name }}
          </span>
          <!-- 图样：黑底 + 波长色光带 -->
          <span class="w-10 h-4 rounded bg-black border border-slate-700 flex items-center justify-center">
            <span class="w-1.5 h-3 rounded-sm" :style="{ background: colorCss, opacity: emptyData ? 0.4 : 1 }"></span>
          </span>
          <!-- 曲线：深色底 + 实色线 -->
          <span class="w-10 h-4 rounded border border-slate-700 flex items-center" style="background:#0f172a">
            <span class="block h-0.5 w-full" :style="{ background: colorCss }"></span>
          </span>
          <!-- 热力图：同色由暗到亮 -->
          <span class="w-10 h-4 rounded border border-slate-700"
            :style="{ background: 'linear-gradient(to right,' + safeOrColor(0.15) + ',' + safeOrColor(0.6) + ',' + colorCss + ')' }"></span>
          <span class="ml-auto text-[10px]" :class="isValid ? 'text-slate-500' : 'text-amber-400'">
            λ={{ store.params.wavelength }}nm
          </span>
        </button>
      </div>
      <div class="flex justify-between text-[9px] text-slate-600 mt-1 px-2">
        <span class="w-10 text-center">图样</span>
        <span class="w-10 text-center">曲线</span>
        <span class="w-10 text-center">热力图</span>
        <span class="w-16"></span>
      </div>
      <div class="text-[10px] text-slate-600 mt-1">
        三类实验共享当前波长颜色；条纹明暗与间距仍由各自光强公式计算，配色视图不改变亮度与计算结果。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOpticsStore } from '../store/optics'
import {
  COLOR_BANDS,
  SAFE_COLOR,
  getColorBand,
  rgbCss,
  rgbHex,
  spectrumGradientCss,
  wavelengthMarkerPercent,
  wavelengthToRGB,
} from '../utils/wavelength'

const store = useOpticsStore()

const experiments = [
  { id: 'double', name: '双缝干涉' },
  { id: 'single', name: '单缝衍射' },
  { id: 'newton', name: '牛顿环' },
]

const wavelength = computed(() => store.params.wavelength)
const emptyData = computed(() => !store.intensityData.length)
const isValid = computed(() => {
  const nm = wavelength.value
  return typeof nm === 'number' && Number.isFinite(nm) && nm >= 380 && nm <= 780
})
const color = computed(() => wavelengthToRGB(wavelength.value))
const band = computed(() => getColorBand(wavelength.value))
const bands = COLOR_BANDS
const gradient = spectrumGradientCss()
const markerPercent = computed(() => wavelengthMarkerPercent(wavelength.value))
const colorCss = computed(() => rgbCss(color.value))
const colorHex = computed(() => rgbHex(color.value))
const safeHex = rgbHex(SAFE_COLOR)

// 区间标签在亮绿/亮黄背景上使用深色字，其余用白字
const bandTextColor = computed(() => {
  const nm = wavelength.value
  return nm >= 510 && nm < 645 ? '#0f172a' : '#f8fafc'
})

function bandWidth(b: { start: number; end: number }): number {
  return ((b.end - b.start) / (780 - 380)) * 100
}

// 数据为空时对照色块以安全色半透明呈现（仅展示层，画布同样回退）
function safeOrColor(alpha: number): string {
  if (!isValid.value) return rgbCss(SAFE_COLOR, alpha)
  return rgbCss(color.value, alpha)
}
</script>
