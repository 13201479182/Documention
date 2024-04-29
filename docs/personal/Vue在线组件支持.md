<!-- markdownlint-disable MD001 MD031 MD033 MD046 MD051 -->

# Vue在线组件支持👇

## 目录

1. [概览](#概览)
2. [图符元素编写](#图符元素编写⤴️)
3. [图符组件编写](#图符组件编写⤴️)

## [概览⤴️](#目录)

#### 图符概览图

![img](/assets/personal/Vue在线组件支持/概览图.jpg)

#### 图符局部图

![img](/assets/personal/Vue在线组件支持/局部图.jpg)

## [图符元素编写⤴️](#概览⤴️)

* 技术方案
  * render & vue3-sfc-loader & vueSFC

* 实现思路
    1. 🎈编写render 👉**主要目标: 创建且返回DOM**
        * 第一次执行:
            * 创建且利用cached缓存DOM
            * 执行第二项
            * 利用Vue创建项目
            * 利用SymbolNode与上述项目建立通信
            * 返回DOM
        * 后续执行:
            * 借助Konva的Node向上述项目实时推送最新数据

    2. 🎈使用vue3-sfc-loader加载vue单文件组件
        * 定义loadModule的options
            * getFile 👉**vue3-sfc-loader基于此函数返回值作为输入**
            * addStyle 👉**vue3-sfc-loader执行此函数会传入css-string**
        * 执行loadModule
            * 在getFile中加载vueSFC,且将加载的字符串作为输出
            * 后续vue字符串的解析、编译、输出都将由插件完成
            * 返回可以动态加载的组件对象
        * 创建并挂载项目
            * 定义异步组件,返回值为上述组件对象
            * 利用createApp加载异步组件并创建项目
            * 挂载项目至DOM

    3. 🎈开发vueSFC
        * 通过监听SymbolNode的symbol-vue-attr-change,可以获取到最新图符数据,在此驱动vueSFC更新
            * 代码示例
                ```JS
                    symbolNode.on(" symbol_ vue_attr_ change", (data) => {
                        const dataBindings = data.target?.a();
                        updateManager.update(dataBindings)
                    } 
                ```
        * 通过监听SymbolNode的transformed,可以获取图元缩放,在此完成样式适配
            * 代码示例
                ```JS
                    symbolNode.on('transformend", (e) -> {
                        // TODO: resetStyle
                    })
                ```
* 详细代码
  * 客户端 :
    ```JS
        function (symbolNode, core, cache) {
            if (!cache.htmlView) {
                // 开发环境: public目录下对应路径
                const componentPath = './component/hmi-table.vue';

                // 创建目标节点
                const VueDom = document.createElement('div')
                VueDom.style.position = 'absolute';
                cache.htmlView = VueDom;

                const options = {
                    moduleCache: {
                        vue: Vue
                    },
                    async getFile(url) {
                        const res = await fetch(url);
                        if (!res.ok) {
                            throw Object.assign(new Error(res.statusText + ' ' + url), { res });
                        } else {
                            return {
                                getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text()
                            }
                        }
                    },
                    addStyle(textContent) {
                        const style = Object.assign(document.createElement('style'), { textContent });
                        const ref = document.head.getElementsByTagName('style')[0] || null;
                        document.head.insertBefore(style, ref)
                    }
                }

                // 加载并渲染当前组件
                const { loadModule } = window['vue3-sfc-loader'];
                Vue.createApp(
                    Vue.defineAsyncComponent({
                        loader: () => loadModule(componentPath, options)
                    })
                ).use(ElementPlus)
                    .provide('symbolNode', symbolNode)
                    .mount(VueDom)
            } else {
                // 重复触发此函数,启用通信逻辑
                symbolNode.fire('symbol_vue_attr_change', symbolNode.a())
            }
            cache.htmlView.style.zIndex = symbolNode.a('zIndex');
            return cache.htmlView
        }
    ```

* 服务端
    ```JS
        function (symbolNode, core, cache) {
            if (!cache.htmlView) {
                // 生产环境: 服务端对应路径
                const componentPath = 'symbols/lhy_勿动/hmi-table.vue';

                // 创建目标节点
                const VueDom = document.createElement('div')
                VueDom.style.position = 'absolute';
                cache.htmlView = VueDom;

                const options = {
                    moduleCache: {
                        vue: Vue
                    },
                    async getFile(url) {
                        /projectCode=([^&]*)/.exec( (window.location.href); 
                        const projectCode = RegExp.$1 || window.editor?.config?.projectcode; 

                        const res = await fetch("displaySvc/resource/getResourceDetail", {
                            method: 'post', 
                            body: JSON.stringify({
                                path,
                                projectcode, 
                                resType: "symbols"
                            })
                        })

                        const res = await fetch(url);
                        const text = await res.json();
                        if (!res.ok) {
                            throw Object.assign(new Error(res.statusText + ' ' + url), { res });
                        } else {
                            return {
                                getContentData: asBinary => asBinary ? res.arrayBuffer() : text.data()
                            }
                        }
                    },
                    addStyle(textContent) {
                        const style = Object.assign(document.createElement('style'), { textContent });
                        const ref = document.head.getElementsByTagName('style')[0] || null;
                        document.head.insertBefore(style, ref)
                    }
                }

                // 加载并渲染当前组件
                const { loadModule } = window['vue3-sfc-loader'];
                Vue.createApp(
                    Vue.defineAsyncComponent({
                        loader: () => loadModule(componentPath, options)
                    })
                ).use(ElementPlus)
                    .provide('symbolNode', symbolNode)
                    .mount(VueDom)
            } else {
                // 重复触发此函数,启用通信逻辑
                symbolNode.fire('symbol_vue_attr_change', symbolNode.a())
            }
            cache.htmlView.style.zIndex = symbolNode.a('zIndex');
            return cache.htmlView
        }
    ```

## [图符组件编写⤴️](#图符元素编写⤴️)

* ❤️类型设计
  * 将图符绑定的所有数据以组为单位枚举并定义对应类型
  * vue模板数据类型以上面类型为基准进行衍生
  * 业务类型基于上面类型进行组合和泛型限制

* ❤️代码设计
  * 定义UpdateManager
    * 目的: 细化业务处理,避免额外性能开销
    * 用途: 拦截数据变化,进行对应业务处理
    * 代码示例
        ```JS
            type TableAttrs = BindingExtendAttrs
                & MultipleDatasourceAttrs
                & PaginationAttrs
                & ScrollerAttrs;

            // 定义table更新类 
            class UpdateManager<Attrs> {
                public cachedAttrs: UpdateManagerAttrsHandlers

                constructor(data: UpdateManagerAttrshandlers) {
                    this.cachedAttrs = data
                }

                get<T extends keyof Attrs>(key: T): Attrs[T] {
                    return this._get(key)
                }

                set(key: keyof Attrs, val: unknown) {
                    return this._set(key, val)
                }

                _get(key) {
                    if (!key) return
                    // 触发属性读取 
                    return this.cachedAttrs[key].val
                }

                _set(key, val: unknown) {
                    // // 场景1: key值不存在
                    if (!key) return false

                    const cachedAttr = this.cachedAttrs[key]
                    if (cachedAttr) {
                        const oldVal = cachedAttr.val;
                        // 场景2. 基本类型的值 
                        if (typeof oldVal !== 'object' && !Object.is(oldVal, val)) {
                            cachedAttr.val = val
                            cachedAttr.update.call(this)
                            return true
                        }
                        // 场景3: 复合类型的值
                        if (typeof oldVal === 'object' && JSON.stringify(oldVal) !== JSON.stringify(val)) {
                            cachedAttr.val = val
                            cachedAttr.update.call(this)
                            return true
                        }
                    } else {
                        // 场景4: 当前值不存在
                        return false
                    }
                }

                update(newData: Attrs & Record<string, unknown>) {
                    if (newData) {
                        Object.keys(this.cachedAttrs).forEach((key) => {
                            this._set(key, newData[key])
                        })
                    }
                }
            }
            // example:
            const updateManager = new UpdateManager<TableAttrs>(tableAttrsHandle)
            updateManager.update(SymbolNode.a())
        ```
  * 定义updateHandler
    * 用途: 声明式定义数据对应的业务处理
    * 代码示例:
        ```JS
            type TableAttrshandlers = Record<
                keyof TableAttrs, {
                    val: any
                    update: (this: UpdateManager<TableAttrs>) => void
                }
            >
            const tableAttrsHandle: TableAttrsHandlers = {
                ...,
                autoScroll: {
                    val: scrollData.autoscroll,
                    update() {
                        const autoScroll = this.get("autoScroll")
                        if (typeof autoScroll === "boolean") {
                            scrollData.autoScroll = autoScroll
                            // 自动滚动实现
                            if (autoScroll) {
                                enableAutoScroll(true)
                            } else {
                                enableAutoScroll(false)
                            }
                        }
                    }
                }
                ...,
            }
        ```

* 运行数据流
  * 图符数据发行变化,推送数据至当前组件
  * 当前组件执行UpdateManager.update执行对应Handler
  * handle执行,更改vue模版依赖的响应式数据
  * vue重新执行render,patch最新dom至DOM,完成DOM的update

* ❤️Handler Example: 滚动
  * 实现描述
  * 详细代码
    * 生成滚动控制
        ```JS
            function enableScrollhandle() {
                const scrollOptions: HandlescrollOptions = {
                    running: false,
                    interval: 2,
                    perHorizontalScrollDistance: 50,
                    perVerticalscrollistance: 50,
                }
                return function (enable: boolean) {
                    if (enable) {
                        // 正在滚动, 即无效操作, 直接结告束
                        if (scrollOptions.running) {
                            return
                        } else {
                            // 启用滚动,需要延退依赖e1-scro11的dom获取
                            scrollOptions.running = true
                            setTimeout(() => {
                                autoScrollhandle(scrollOptions)
                            }, 200)
                        }
                    } else {
                        scrollOptions.running = false
                    }
                }
            }
            const enableAutoScroll = enableScrollhandle()
        ```
    * 滚动具体实现
        ```JS
            function autoscrollHandle(options: HandlescrollOptions) {
                // 开启计时器,进行周期逻辑处理
                const timer = setInterval(() => {
                    // 优先确定当前是否在执行
                    if (!options.rumning) {
                        return clearInterval(timer)
                    } else {
                        // 周期运转的逻辑
                        const direction = scrollData.autoScrollDirection
                        const complete = isScrollComplete(direction)
                        const isPagination = paginationData.showPagination

                        if (complete === false) {
                            // 场景1: 触发滚动调度,但没有滚动条
                            options.running = false
                        } else {
                            const { isScrollComplete, offset, scrollRef } = complete

                            if (isScrollComplete) {
                                /**
                                * 当前页滚动完成 
                                * 场景1: 当前无分页,垂直滚动完成 
                                * 场景2: 当前无分页,水平滚动完成 
                                * 场景3: 当前有分页,垂直滚列完成 
                                * 场景4: 当前有分页,水平滚动完成 
                                */
                                // 特殊场景3: 分页&垂直滚动 
                                if (isPagination && direction === 'column') {
                                    const pageCount = paginationData.totals / paginationData.pagesizes
                                    const curPage = paginationData.currentPage
                                    if (curPage < pageCount) {
                                        paginationData.currentpage += 1
                                    } else {
                                        paginationData.currentPage = 1
                                    }
                                    // 触发分页变化
                                    handleCurrentChange(paginationData.currentPage)
                                }
                                // 所有场景: 重置水平垂直偏移量 
                                direction === 'row' ? scrollRef.setscrollLeft(0) ? scrollRef.setscrollTop(0)
                            } else {
                                // 当前页滚动未完成
                                if (direction === 'row') {
                                    /** 
                                    * 进行水平滚动
                                    * frames: 每次滚动可以使用的帧数
                                    * 60/2: 将帧数折半,用于保证完成过渡
                                    * step: 计算每帧对应的步长
                                    * */
                                    const frames = (options.interval * 60) / 2
                                    const step = options.perHorizontalScrollDistance / frames
                                    setScrollAnimation(
                                        scrollRef.setscrollleft,
                                        offset,
                                        offset + options.perHorizontalScrolldistance,
                                        step
                                    )
                                } else {
                                    // 进行垂直移动
                                    const frames = (options.interval * 60) / 2
                                    const step = options.perVerticalScrollDistance / frames
                                    setScrollAnimation(
                                        scrollRef.setscrolllTop,
                                        offset,
                                        offset + options.perVerticalScrollDistance,
                                        step
                                    )
                                }
                            }
                        }
                    }
                }, options.interval * 1000)
            }
        ```
    * 滚动完成鉴别
        ```JS
            function isScrollComplete(direction: ScrollerAttrs['autoscrollDirection']) {
                const scrollRef = elTableRef.value?.ScrollBarRef
                if (scrollRef) {
                    const wraper: HTMLDivElement = scrollRef.wrapRef,
                        viewr: HTMLDivElement = scrollRef.wrapRef.children[0]
                    const wh = wraper.clientHeight,
                        ww = wraper.clientWidth,
                        wt = wraper.scrollTop,
                        wl = wraper.scrollLeft,
                        vh = viewr.clientHeight,
                        vw = viewr.clientWidth

                    if (direction === 'column') {
                        if (wh + wt >= vh) {
                            // 场暴2: 垂直滚动完成 
                            return {
                                isScrollComplete: true,
                                offset: wt,
                                scrollRef
                            }
                        } else {
                            return {
                                isScrollComplete: false,
                                offset: wt,
                                scrollRef
                            }
                        }
                    } else {
                        if (wl + ww >= vw) {
                            // 场鼻2： 水平滚动完成 
                            return {
                                isScrollComplete: true,
                                offset: wl,
                                scrollRef
                            }

                        } else {
                            return {
                                isScrollComplete: false,
                                offset: wl,
                                scrollRef
                            }

                        }
                    }
                } else {
                    // 场暴1： 滚动条不存在,认为无法滚动
                    return false
                }
            }
        ```
    * 滚动动画补帧
        ```JS
            function setScrollAnimation(
                scroll: (end: number) => void,
                start: number,
                end: number,
                step = 1
            ) {
                const nextstart = start + step
                if (nextstart > end) {
                    scroll(end)
                } else {
                    scroll(nextstart)
                    requestAnimationFrame(() => {
                        setScrollAnimation(scroll, nextstart, end, step)
                    })
                }
            }
        ```

[<center>**返回顶部🔝**</center>](#vue在线组件支持👇)
