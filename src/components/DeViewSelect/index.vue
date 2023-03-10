<template>
  <div class="el-view-select" :class="selectClass">
    <el-select
      ref="select"
      v-model="innerValues"
      v-popover:popover
      :title="labels"
      popper-class="view-select-option"
      style="width: 100%;"
      multiple
      clearable
      @remove-tag="_selectRemoveTag"
      @clear="_selectClearFun"
      @focus="_popoverShowFun"
    >
      <el-option
        v-for="item in selectedViews"
        :key="item.viewId"
        :label="item.title"
        :value="item.viewId"
      />
    </el-select>

    <el-popover ref="popover" v-model="visible" :placement="placement" :transition="transition" :popper-class="popperClass" :width="width" trigger="click">
      <el-scrollbar v-if="viewLoaded" tag="div" wrap-class="el-select-dropdown__wrap" view-class="el-select-dropdown__list" class="is-empty">
        <div :style="{'height': panelHeight + 'px'}">
          <Preview
            :component-data="componentData"
            :canvas-style-data="canvasStyleData"
            :panel-info="panelInfo"
            :show-position="showPosition"
          />
        </div>

      </el-scrollbar>
      <el-empty v-else style="height: 150px;" :image-size="120" description="" />

    </el-popover>
  </div>
</template>

<script>
import { on, off } from './dom'
import Preview from '@/components/canvas/components/Editor/Preview'
import { findOne } from '@/api/panel/panel'
import { panelDataPrepare } from '@/components/canvas/utils/utils'
export default {
  name: 'DeViewSelect',
  components: { Preview },
  props: {
    value: {
      type: Array,
      default: () => []
    },
    panelId: {
      type: String,
      default: null
    }

  },
  data() {
    return {
      labels: [],
      visible: false,
      placement: 'bottom',
      transition: 'el-zoom-in-top',
      width: 500,
      selectClass: 'my-top-class',
      innerValues: [],
      panelHeight: 450,
      showPosition: 'email-task',
      viewLoaded: false
    }
  },
  computed: {
    popperClass() {
      const _c = 'el-view-select-popper ' + this.popoverClass
      return this.disabled ? _c + ' disabled ' : _c
    },
    selectedViews() {
      return this.$store.getters.panelViews[this.panelId]
    }
  },
  watch: {
    value(val, old) {
      this.innerValues = val
    },
    innerValues(val, old) {
      if (val !== old) {
        this.$emit('input', val)
      }
    },
    panelId(val, old) {
      if (val !== old) {
        this.loadView()
      }
    },
    selectedViews: {
      handler(val) {
        if (!val || !JSON.stringify(val)) {
          this.labels = []
          this.innerValues = []
          return
        }
        const views = JSON.parse(JSON.stringify(val))
        const viewIds = []
        const names = []
        views.forEach(item => {
          viewIds.push(item.viewId)
          names.push(item.title)
        })
        this.innerValues = JSON.parse(JSON.stringify(viewIds))
        this.labels = JSON.parse(JSON.stringify(names))
      },
      deep: true
    }
  },
  mounted() {
    this._updateH()
    this.$nextTick(() => {
      on(document, 'mouseup', this._popoverHideFun)
    })
  },
  beforeDestroy() {
    off(document, 'mouseup', this._popoverHideFun)
  },
  created() {
    this.loadView()
  },
  methods: {
    loadView() {
      this.viewLoaded = false
      this.panelId && findOne(this.panelId).then(response => {
        this.panelInfo = {
          id: response.data.id,
          name: response.data.name,
          privileges: response.data.privileges,
          sourcePanelName: response.data.sourcePanelName,
          status: response.data.status
        }
        this.$store.dispatch('panel/setPanelInfo', this.panelInfo)
        panelDataPrepare(JSON.parse(response.data.panelData), JSON.parse(response.data.panelStyle), rsp => {
          this.viewLoaded = true
          this.componentData = rsp.componentData
          this.canvasStyleData = rsp.componentStyle
        })
      })
    },
    _updateH() {
      this.$nextTick(() => {
        this.width = this.$refs.select.$el.getBoundingClientRect().width
        this.panelHeight = this.width * 9 / 16
      })
    },
    _popoverShowFun(val) {
      this._updateH()
      this.$emit('onFoucs')
    },
    _popoverHideFun(e) {
      const path = this._getEventPath(e)
      const isInside = path.some(list => {
        return list.className && typeof list.className === 'string' && list.className.indexOf('el-view-select') !== -1
      })
      if (!isInside) {
        this.visible = false
      }
    },
    _getEventPath(evt) {
      const path = (evt.composedPath && evt.composedPath()) || evt.path
      const target = evt.target
      if (path != null) {
        return path.indexOf(window) < 0 ? path.concat(window) : path
      }
      if (target === window) {
        return [window]
      }
      function getParents(node, memo) {
        memo = memo || []
        const parentNode = node.parentNode
        if (!parentNode) {
          return memo
        } else {
          return getParents(parentNode, memo.concat(parentNode))
        }
      }
      return [target].concat(getParents(target), window)
    },
    _selectRemoveTag(viewId) {
      this.selectedViews.forEach(item => {
        if (item.viewId === viewId) {
          this.$store.dispatch('task/delView', { 'panelId': this.panelId, 'viewId': item.viewId })
        }
      })
    },
    _selectClearFun() {
      const views = JSON.parse(JSON.stringify(this.selectedViews))
      views.forEach(item => {
        this.$store.dispatch('task/delView', { 'panelId': this.panelId, 'viewId': item.viewId })
      })
    }
  }

}
</script>

<style lang="scss" scoped>
.el-view-select .view-select-option {
  display: none !important;
}

.el-view-select-popper {
  max-height: 800px;
  overflow: auto;
}
.el-view-select-popper.disabled {
  display: none !important;
}
.el-view-select-popper .el-button--small {
  width: 25px !important;
  min-width: 25px !important;
}

.el-view-select-popper[x-placement^='bottom'] {
  margin-top: 5px;
}

.my-top-class {
  width: 100%;
}
</style>
