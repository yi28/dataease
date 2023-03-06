import {
  getLabel,
  getPadding,
  getTheme,
  getTooltip,
  getXAxis,
  getYAxis
} from '@/views/chart/chart/common/common_antv'
import { Waterfall } from '@antv/g2plot'

export function baseWaterfallOptionAntV(plot, container, chart, action) {
  // theme
  const theme = getTheme(chart)
  // attr
  const label = getLabel(chart)
  const tooltip = getTooltip(chart)
  // style
  // const legend = getLegend(chart)
  const xAxis = getXAxis(chart)
  const yAxis = getYAxis(chart)
  // fix yAxis
  if (yAxis) {
    yAxis.min = yAxis.minLimit
    yAxis.max = yAxis.maxLimit
    delete yAxis.minLimit
    delete yAxis.maxLimit
  }
  // data
  const data = chart.data.datas
  // total
  const total = {
    label: '合计',
    style: {
      fill: theme.styleSheet.paletteQualitative10[2]
    }
  }
  // options
  const options = {
    theme: theme,
    data: data,
    xField: 'field',
    yField: 'value',
    seriesField: 'category',
    appendPadding: getPadding(chart),
    label: label,
    tooltip: tooltip,
    legend: {
      items: [
        { name: '增加', marker: {
          style: {
            fill: theme.styleSheet.paletteQualitative10[0]
          }
        }},
        { name: '减少', marker: {
          style: {
            fill: theme.styleSheet.paletteQualitative10[1]
          }
        }},
        { name: '合计', marker: {
          style: {
            fill: theme.styleSheet.paletteQualitative10[2]
          }
        }}
      ]
    },
    xAxis: xAxis,
    yAxis: yAxis,
    risingFill: theme.styleSheet.paletteQualitative10[0],
    fallingFill: theme.styleSheet.paletteQualitative10[1],
    total: total,
    interactions: [
      {
        type: 'tooltip', cfg: {
          start: [{ trigger: 'interval:mousemove', action: 'tooltip:show' }],
          end: [{ trigger: 'interval:mouseleave', action: 'tooltip:hide' }]
        }
      }
    ]
  }
  // size
  let customAttr = {}
  if (chart.customAttr) {
    customAttr = JSON.parse(chart.customAttr)
    if (customAttr.size) {
      const s = JSON.parse(JSON.stringify(customAttr.size))
      if (s.barDefault) {
        delete options.marginRatio
      } else {
        options.marginRatio = s.barGap
      }
    }
  }

  // 开始渲染
  if (plot) {
    plot.destroy()
  }
  plot = new Waterfall(container, options)

  plot.off('interval:click')
  plot.on('interval:click', action)

  return plot
}
