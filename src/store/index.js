import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import app from './modules/app'
import settings from './modules/settings'
import user from './modules/user'
import permission from './modules/permission'
import dataset from './modules/dataset'
import chart from './modules/chart'
import request from './modules/request'
import panel from './modules/panel'
import application from './modules/application'
import lic from './modules/lic'
import msg from './modules/msg'
import map from './modules/map'
import animation from '@/components/canvas/store/animation'
import compose from '@/components/canvas/store/compose'
import contextmenu from '@/components/canvas/store/contextmenu'
import copy from '@/components/canvas/store/copy'
import event from '@/components/canvas/store/event'
import layer from '@/components/canvas/store/layer'
import snapshot from '@/components/canvas/store/snapshot'
import lock from '@/components/canvas/store/lock'
import task from './modules/task'
import { valueValid, formatCondition } from '@/utils/conditionUtil'
import { Condition } from '@/components/widget/bean/Condition'

import {
  DEFAULT_COMMON_CANVAS_STYLE_STRING
} from '@/views/panel/panel'
import bus from '@/utils/bus'
import { BASE_MOBILE_STYLE } from '@/components/canvas/custom-component/component-list'
import { TYPE_CONFIGS } from '@/views/chart/chart/util'
import { deepCopy } from '@/components/canvas/utils/utils'

Vue.use(Vuex)

const data = {
  state: {
    ...animation.state,
    ...compose.state,
    ...contextmenu.state,
    ...copy.state,
    ...event.state,
    ...layer.state,
    ...snapshot.state,
    ...lock.state,
    ...task.state,
    // 编辑器模式 edit preview
    editMode: 'edit',
    // 当前页面全局数据 包括扩展公共样式 公共的仪表板样式，用来实时响应样式的变化
    canvasStyleData: DEFAULT_COMMON_CANVAS_STYLE_STRING,
    // 当前展示画布缓存数据
    componentDataCache: null,
    // 当前展示画布组件数据
    componentData: [],
    // 当前展示画布视图信息
    componentViewsData: {},
    // PC布局画布组件数据
    pcComponentData: [],
    // 移动端布局画布组件数据
    mobileComponentData: [],
    // 当前点击组件
    curComponent: null,
    curCanvasScale: null,
    curComponentIndex: null,
    // 预览仪表板缩放信息
    previewCanvasScale: {
      scalePointWidth: 1,
      scalePointHeight: 1
    },
    // 点击画布时是否点中组件，主要用于取消选中组件用。
    // 如果没点中组件，并且在画布空白处弹起鼠标，则取消当前组件的选中状态
    isClickComponent: false,
    canvasCommonStyleData: DEFAULT_COMMON_CANVAS_STYLE_STRING,
    // 联动设置状态
    linkageSettingStatus: false,
    // 当前设置联动的组件
    curLinkageView: null,
    // 和当前组件联动的目标组件
    targetLinkageInfo: [],
    // 当前仪表板联动 下钻 上卷等信息
    nowPanelTrackInfo: {},
    // 当前仪表板的跳转信息基础信息
    nowPanelJumpInfo: {},
    // 当前仪表板的跳转信息(只包括仪表板)
    nowPanelJumpInfoTargetPanel: {},
    // 当前仪表板的外部参数信息
    nowPanelOuterParamsInfo: {},
    // 拖拽的组件信息
    dragComponentInfo: null,
    // 仪表板组件间隙大小 px
    componentGap: 5,
    // 移动端布局状态
    mobileLayoutStatus: false,
    // 公共链接状态(当前是否是公共链接打开)
    publicLinkStatus: false,
    pcMatrixCount: {
      x: 36,
      y: 18
    },
    mobileMatrixCount: {
      x: 6,
      y: 12
    },
    mobileLayoutStyle: {
      x: 300,
      y: 600
    },
    scrollAutoMove: 0,
    // 视图是否编辑记录
    panelViewEditInfo: {},
    // 仪表板视图明细
    panelViewDetailsInfo: {},
    // 当前tab页内组件
    curActiveTabInner: null,
    // static resource local path
    staticResourcePath: '/static-resource/',
    // panel edit batch operation status
    batchOptStatus: false,
    // Currently selected components
    curBatchOptComponents: [],
    // Currently selected Multiplexing components
    curMultiplexingComponents: {},
    mixProperties: [],
    mixPropertiesInner: {},
    batchOptChartInfo: null,
    batchOptViews: {},
    // properties changed
    changeProperties: {
      customStyle: {},
      customAttr: {}
    },
    allViewRender: [],
    isInEditor: false // 是否在编辑器中，用于判断复制、粘贴组件时是否生效，如果在编辑器外，则无视这些操作
  },
  mutations: {
    ...animation.mutations,
    ...compose.mutations,
    ...contextmenu.mutations,
    ...copy.mutations,
    ...event.mutations,
    ...layer.mutations,
    ...snapshot.mutations,
    ...lock.mutations,

    setClickComponentStatus(state, status) {
      state.isClickComponent = status
    },

    setEditMode(state, mode) {
      state.editMode = mode
    },

    setCanvasStyle(state, style) {
      if (style) {
        style['selfAdaption'] = true
      }
      state.canvasStyleData = style
    },

    setCurComponent(state, { component, index }) {
      // 当前视图操作状态置空
      if (component) {
        component['optStatus'] = {
          dragging: false,
          resizing: false
        }
        // Is the current component in editing status
        if (!state.curComponent) {
          component['editing'] = false
        } else if (component.id !== state.curComponent.id) {
          component['editing'] = false
        }
      }
      state.styleChangeTimes = 0
      state.curComponent = component
      state.curComponentIndex = index
    },

    setCurActiveTabInner(state, curActiveTabInner) {
      state.curActiveTabInner = curActiveTabInner
    },

    setCurCanvasScale(state, curCanvasScale) {
      state.curCanvasScale = curCanvasScale
    },
    setPreviewCanvasScale(state, scale) {
      if (scale.scaleWidth) {
        state.previewCanvasScale.scalePointWidth = scale.scaleWidth
      }
      if (scale.scaleHeight) {
        state.previewCanvasScale.scalePointHeight = scale.scaleHeight
      }
    },
    setShapeStyle({ curComponent, canvasStyleData, curCanvasScale }, { top, left, width, height, rotate }) {
      if (curComponent) {
        if (top || top === 0) curComponent.style.top = (top / curCanvasScale.scalePointHeight) + 0.0000001
        if (left || left === 0) curComponent.style.left = (left / curCanvasScale.scalePointWidth) + 0.0000001
        if (width || width === 0) curComponent.style.width = (width / curCanvasScale.scalePointWidth + 0.0000001)
        if (height || height === 0) curComponent.style.height = (height / curCanvasScale.scalePointHeight) + 0.0000001
        if (rotate || rotate === 0) curComponent.style.rotate = rotate
      }
    },

    setShapeSingleStyle({ curComponent }, { key, value }) {
      curComponent.style[key] = value
    },

    setComponentData(state, componentData = []) {
      Vue.set(state, 'componentData', componentData)
    },

    setComponentViewsData(state, componentViewsData = {}) {
      Vue.set(state, 'componentViewsData', componentViewsData)
    },

    setPcComponentData(state, pcComponentData = []) {
      Vue.set(state, 'pcComponentData', pcComponentData)
    },
    setComponentDataCache(state, componentDataCache) {
      Vue.set(state, 'componentDataCache', componentDataCache)
    },

    setMobileComponentData(state, mobileComponentData = []) {
      Vue.set(state, 'mobileComponentData', mobileComponentData)
    },
    addComponent(state, { component, index }) {
      if (index !== undefined) {
        state.componentData.splice(index, 0, component)
      } else {
        state.componentData.push(component)
      }
    },
    removeViewFilter(state, componentId) {
      state.componentData = state.componentData.map(item => {
        const newItem = item
        newItem.filters = newItem.filters && newItem.filters.filter(filter => filter.componentId !== componentId) || []
        return newItem
      })
    },
    addViewFilter(state, data) {
      const condition = formatCondition(data)
      const vValid = valueValid(condition)
      //   1.根据componentId过滤
      const filterComponentId = condition.componentId

      //   2.循环每个Component 得到 三种情况 a增加b删除c无操作
      const viewIdMatch = (viewIds, viewId) => !viewIds || viewIds.length === 0 || viewIds.includes(viewId)

      for (let index = 0; index < state.componentData.length; index++) {
        const element = state.componentData[index]
        if (element.type && element.type === 'de-tabs') {
          for (let idx = 0; idx < element.options.tabList.length; idx++) {
            const ele = element.options.tabList[idx].content
            if (!ele.type || ele.type !== 'view') continue
            const currentFilters = ele.filters || []
            const vidMatch = viewIdMatch(condition.viewIds, ele.propValue.viewId)

            let jdx = currentFilters.length
            while (jdx--) {
              const filter = currentFilters[jdx]
              if (filter.componentId === filterComponentId) {
                currentFilters.splice(jdx, 1)
              }
            }
            // 不存在该条件 且 条件有效 直接保存该条件
            // !filterExist && vValid && currentFilters.push(condition)
            vidMatch && vValid && currentFilters.push(condition)
            ele.filters = currentFilters
          }
          state.componentData[index] = element
        }
        if (!element.type || element.type !== 'view') continue
        const currentFilters = element.filters || []
        const vidMatch = viewIdMatch(condition.viewIds, element.propValue.viewId)
        let j = currentFilters.length
        while (j--) {
          const filter = currentFilters[j]
          if (filter.componentId === filterComponentId) {
            currentFilters.splice(j, 1)
          }
        }
        // 不存在该条件 且 条件有效 直接保存该条件
        // !filterExist && vValid && currentFilters.push(condition)
        vidMatch && vValid && currentFilters.push(condition)
        element.filters = currentFilters
        state.componentData[index] = element
      }
    },

    // 添加联动 下钻 等过滤组件
    addViewTrackFilter(state, data) {
      const viewId = data.viewId
      let trackInfo
      if (data.option === 'linkage') {
        trackInfo = state.nowPanelTrackInfo
      } else {
        trackInfo = state.nowPanelJumpInfoTargetPanel
      }
      for (let index = 0; index < state.componentData.length; index++) {
        const element = state.componentData[index]
        if (element.type && element.type === 'de-tabs') {
          for (let idx = 0; idx < element.options.tabList.length; idx++) {
            const ele = element.options.tabList[idx].content
            if (!ele.type || ele.type !== 'view') continue

            const currentFilters = element.linkageFilters || [] // 当前联动filter

            data.dimensionList.forEach(dimension => {
              const sourceInfo = viewId + '#' + dimension.id
              // 获取所有目标联动信息
              const targetInfoList = trackInfo[sourceInfo] || []
              targetInfoList.forEach(targetInfo => {
                const targetInfoArray = targetInfo.split('#')
                const targetViewId = targetInfoArray[0] // 目标视图
                if (ele.propValue.viewId === targetViewId) { // 如果目标视图 和 当前循环组件id相等 则进行条件增减
                  const targetFieldId = targetInfoArray[1] // 目标视图列ID
                  const condition = new Condition('', targetFieldId, 'eq', [dimension.value], [targetViewId])
                  condition.sourceViewId = viewId
                  let j = currentFilters.length
                  while (j--) {
                    const filter = currentFilters[j]
                    // 兼容性准备 viewIds 只会存放一个值
                    if (targetFieldId === filter.fieldId && filter.viewIds.includes(targetViewId)) {
                      currentFilters.splice(j, 1)
                    }
                  }
                  // 不存在该条件 且 条件有效 直接保存该条件
                  // !filterExist && vValid && currentFilters.push(condition)
                  currentFilters.push(condition)
                }
              })
            })

            ele.linkageFilters = currentFilters
          }
          state.componentData[index] = element
        }
        if (!element.type || element.type !== 'view') continue
        const currentFilters = element.linkageFilters || [] // 当前联动filter
        // 联动的视图情况历史条件
        // const currentFilters = []

        data.dimensionList.forEach(dimension => {
          const sourceInfo = viewId + '#' + dimension.id
          // 获取所有目标联动信息
          const targetInfoList = trackInfo[sourceInfo] || []
          targetInfoList.forEach(targetInfo => {
            const targetInfoArray = targetInfo.split('#')
            const targetViewId = targetInfoArray[0] // 目标视图
            if (element.propValue.viewId === targetViewId) { // 如果目标视图 和 当前循环组件id相等 则进行条件增减
              const targetFieldId = targetInfoArray[1] // 目标视图列ID
              const condition = new Condition('', targetFieldId, 'eq', [dimension.value], [targetViewId])
              condition.sourceViewId = viewId
              let j = currentFilters.length
              while (j--) {
                const filter = currentFilters[j]
                // 兼容性准备 viewIds 只会存放一个值
                if (targetFieldId === filter.fieldId && filter.viewIds.includes(targetViewId)) {
                  currentFilters.splice(j, 1)
                }
              }
              // 不存在该条件 且 条件有效 直接保存该条件
              // !filterExist && vValid && currentFilters.push(condition)
              currentFilters.push(condition)
            }
          })
        })

        element.linkageFilters = currentFilters
        state.componentData[index] = element
      }
    },
    // 添加外部参数的过滤条件
    addOuterParamsFilter(state, params) {
      // params 结构 {key1:value1,key2:value2}
      if (params) {
        const trackInfo = state.nowPanelOuterParamsInfo

        for (let index = 0; index < state.componentData.length; index++) {
          const element = state.componentData[index]
          if (!element.type || element.type !== 'view') continue
          const currentFilters = element.outerParamsFilters || [] // 外部参数信息

          // 外部参数 可能会包含多个参数
          Object.keys(params).forEach(function(sourceInfo) {
            // 获取外部参数的值 sourceInfo 是外部参数名称 支持数组传入
            let paramValue = params[sourceInfo]
            let operator = 'in'
            if (paramValue && !Array.isArray(paramValue)) {
              paramValue = [paramValue]
              operator = 'eq'
            }
            // 获取所有目标联动信息
            const targetInfoList = trackInfo[sourceInfo] || []

            targetInfoList.forEach(targetInfo => {
              const targetInfoArray = targetInfo.split('#')
              const targetViewId = targetInfoArray[0] // 目标视图
              if (element.propValue.viewId === targetViewId) { // 如果目标视图 和 当前循环组件id相等 则进行条件增减
                const targetFieldId = targetInfoArray[1] // 目标视图列ID
                const condition = new Condition('', targetFieldId, operator, paramValue, [targetViewId])
                let j = currentFilters.length
                while (j--) {
                  const filter = currentFilters[j]
                  // 兼容性准备 viewIds 只会存放一个值
                  if (targetFieldId === filter.fieldId && filter.viewIds.includes(targetViewId)) {
                    currentFilters.splice(j, 1)
                  }
                }
                // 不存在该条件 且 条件有效 直接保存该条件
                // !filterExist && vValid && currentFilters.push(condition)
                currentFilters.push(condition)
              }
            })
            element.outerParamsFilters = currentFilters
            state.componentData[index] = element
          })
        }
      }
    },

    setComponentWithId(state, component) {
      for (let index = 0; index < state.componentData.length; index++) {
        const element = state.componentData[index]
        if (element.id && element.id === component.id) {
          state.componentData[index] = component
          return
        }
      }
      state.componentData.push(component)
    },
    deleteComponentWithId(state, id) {
      for (let index = 0; index < state.componentData.length; index++) {
        const element = state.componentData[index]
        if (element.id && element.id === id) {
          state.componentData.splice(index, 1)
          break
        }
      }
    },

    deleteComponent(state, index) {
      if (index === undefined) {
        index = state.curComponentIndex
      }
      state.componentData.splice(index, 1)
    },
    setLinkageInfo(state, targetLinkageInfo) {
      state.linkageSettingStatus = true
      state.curLinkageView = state.curComponent
      state.targetLinkageInfo = targetLinkageInfo
    },
    clearLinkageSettingInfo(state) {
      state.linkageSettingStatus = false
      state.curLinkageView = null
      state.targetLinkageInfo = []
    },
    setNowPanelTrackInfo(state, trackInfo) {
      state.nowPanelTrackInfo = trackInfo
    },
    setNowPanelJumpInfo(state, jumpInfo) {
      state.nowPanelJumpInfo = jumpInfo.baseJumpInfoMap
    },
    setNowTargetPanelJumpInfo(state, jumpInfo) {
      state.nowPanelJumpInfoTargetPanel = jumpInfo.baseJumpInfoPanelMap
    },
    setNowPanelOuterParamsInfo(state, outerParamsInfo) {
      state.nowPanelOuterParamsInfo = outerParamsInfo.outerParamsInfoMap
    },
    clearPanelLinkageInfo(state) {
      state.componentData.forEach(item => {
        if (item.linkageFilters && item.linkageFilters.length > 0) {
          item.linkageFilters.splice(0, item.linkageFilters.length)
        }
      })
    },
    setDragComponentInfo(state, dragComponentInfo) {
      dragComponentInfo['shadowStyle'] = {
        x: 0,
        y: 0,
        height: 0,
        width: 0
      }
      state.dragComponentInfo = dragComponentInfo
    },
    clearDragComponentInfo(state) {
      // 如果当前没有拖拽的元素没有放置到画布 清理一下矩阵的占位符
      if (state.dragComponentInfo.moveStatus !== 'drop') {
        bus.$emit('onRemoveLastItem')
      }
      state.dragComponentInfo = null
    },
    setMobileLayoutStatus(state, status) {
      state.mobileLayoutStatus = status
    },
    setPublicLinkStatus(state, status) {
      state.publicLinkStatus = status
    },
    // 启用移动端布局
    openMobileLayout(state) {
      state.componentDataCache = null
      state.componentDataCache = JSON.stringify(state.componentData)
      state.pcComponentData = state.componentData
      const mainComponentData = []
      // 移动端布局转换
      state.componentData.forEach(item => {
        item.mobileStyle = (item.mobileStyle || BASE_MOBILE_STYLE)
        if (item.mobileSelected) {
          item.style.width = item.mobileStyle.style.width
          item.style.height = item.mobileStyle.style.height
          item.style.top = item.mobileStyle.style.top
          item.style.left = item.mobileStyle.style.left
          item.style.borderRadius = 3
          item.x = item.mobileStyle.x
          item.y = item.mobileStyle.y
          item.sizex = item.mobileStyle.sizex
          item.sizey = item.mobileStyle.sizey
          item.auxiliaryMatrix = item.mobileStyle.auxiliaryMatrix
          mainComponentData.push(item)
        }
      })
      state.componentData = mainComponentData
      state.mobileLayoutStatus = !state.mobileLayoutStatus
    },
    setScrollAutoMove(state, offset) {
      state.scrollAutoMove = offset
    },
    initPanelComponents(state, panelComponents) {
      if (panelComponents) {
        state.canvasStyleData['panelComponents'] = panelComponents
      }
    },
    recordViewEdit(state, viewInfo) {
      state.panelViewEditInfo[viewInfo.viewId] = viewInfo.hasEdit
    },
    resetViewEditInfo(state) {
      state.panelViewEditInfo = {}
    },
    removeCurBatchComponentWithId(state, id) {
      for (let index = 0; index < state.curBatchOptComponents.length; index++) {
        const element = state.curBatchOptComponents[index]
        if (element === id) {
          delete state.batchOptViews[id]
          state.curBatchOptComponents.splice(index, 1)
          this.commit('setBatchOptChartInfo')
          break
        }
      }
    },
    addCurBatchComponent(state, id) {
      if (id) {
        state.curBatchOptComponents.push(id)
        // get view base info
        const viewBaseInfo = state.componentViewsData[id]
        // get properties
        const viewConfig = state.allViewRender.filter(item => item.render === viewBaseInfo.render && item.value === viewBaseInfo.type)
        if (viewConfig && viewConfig.length > 0) {
          state.batchOptViews[id] = viewConfig[0]
          this.commit('setBatchOptChartInfo')
        }
      }
    },
    removeCurMultiplexingComponentWithId(state, id) {
      delete state.curMultiplexingComponents[id]
    },
    addCurMultiplexingComponent(state, { component, componentId }) {
      if (componentId) {
        state.curMultiplexingComponents[componentId] = component
      }
    },
    setBatchOptChartInfo(state) {
      let render = null
      let type = null
      let allTypes = ''
      let isPlugin = null
      state.mixProperties = []
      state.mixPropertiesInner = {}
      let mixPropertiesTemp = []
      let mixPropertyInnerTemp = {}
      if (state.batchOptViews && JSON.stringify(state.batchOptViews) !== '{}') {
        for (const key in state.batchOptViews) {
          if (mixPropertiesTemp.length > 0) {
            // If it exists , taking the intersection
            mixPropertiesTemp = mixPropertiesTemp.filter(property => state.batchOptViews[key].properties.indexOf(property) > -1)
            // 根据当前的mixPropertiesTemp 再对 mixPropertyInnerTemp 进行过滤
            mixPropertiesTemp.forEach(propertyInnerItem => {
              if (mixPropertyInnerTemp[propertyInnerItem] && state.batchOptViews[key].propertyInner[propertyInnerItem]) {
                mixPropertyInnerTemp[propertyInnerItem] = mixPropertyInnerTemp[propertyInnerItem].filter(propertyInnerItemValue => state.batchOptViews[key].propertyInner[propertyInnerItem].indexOf(propertyInnerItemValue) > -1)
              }
            })
          } else {
            // If it doesn't exist, assignment directly
            mixPropertiesTemp = deepCopy(state.batchOptViews[key].properties)
            mixPropertyInnerTemp = deepCopy(state.batchOptViews[key].propertyInner)
          }

          if (render && render !== state.batchOptViews[key].render) {
            render = 'mix'
          } else {
            render = state.batchOptViews[key].render
          }

          allTypes = allTypes + '-' + state.batchOptViews[key].value
          if (type && type !== state.batchOptViews[key].value) {
            type = 'mix'
          } else {
            type = state.batchOptViews[key].value
          }

          if (isPlugin && isPlugin !== state.batchOptViews[key].isPlugin) {
            isPlugin = 'mix'
          } else {
            isPlugin = state.batchOptViews[key].isPlugin
          }
        }
        mixPropertiesTemp.forEach(property => {
          if (mixPropertyInnerTemp[property] && mixPropertyInnerTemp[property].length) {
            state.mixPropertiesInner[property] = mixPropertyInnerTemp[property]
            state.mixProperties.push(property)
          }
        })

        if (type && type === 'mix') {
          type = type + '-' + allTypes
        }
        // Assembly history settings 'customAttr' & 'customStyle'
        state.batchOptChartInfo = {
          'mode': 'batchOpt',
          'render': render,
          'type': type,
          'isPlugin': isPlugin,
          'customAttr': state.changeProperties.customAttr,
          'customStyle': state.changeProperties.customStyle
        }
      } else {
        state.batchOptChartInfo = null
      }
    },
    setBatchOptStatus(state, status) {
      state.batchOptStatus = status
      // Currently selected components
      state.curBatchOptComponents = []
      state.mixProperties = []
      state.mixPropertyInnder = {}
      state.batchOptChartInfo = null
      state.batchOptViews = {}
      state.changeProperties = {
        customStyle: {},
        customAttr: {}
      }
    },
    setChangeProperties(state, propertyInfo) {
      state.changeProperties[propertyInfo.custom][propertyInfo.property] = propertyInfo.value
    },
    initCanvas(state) {
      this.commit('setCurComponent', { component: null, index: null })
      this.commit('clearLinkageSettingInfo', false)
      this.commit('resetViewEditInfo')
      this.commit('initCurMultiplexingComponents')
      state.batchOptStatus = false
      // Currently selected components
      state.curBatchOptComponents = []
      state.curMultiplexingComponents = {}
      state.mixProperties = []
      state.mixPropertyInnder = {}
      state.batchOptChartInfo = null
      state.batchOptViews = {}
      state.changeProperties = {
        customStyle: {},
        customAttr: {}
      }
      state.isInEditor = true
    },
    initViewRender(state, pluginViews) {
      pluginViews.forEach(plugin => {
        plugin.isPlugin = true
      })
      state.allViewRender = [...TYPE_CONFIGS, ...pluginViews]
    },
    initCurMultiplexingComponents(state) {
      state.curMultiplexingComponents = {}
    },
    setInEditorStatus(state, status) {
      state.isInEditor = status
    }
  },
  modules: {
    app,
    settings,
    user,
    permission,
    dataset,
    chart,
    request,
    panel,
    application,
    lic,
    msg,
    map,
    task
  },
  getters
}

export default new Vuex.Store(data)
