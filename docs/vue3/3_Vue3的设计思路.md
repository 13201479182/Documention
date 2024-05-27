# 第一章: 框架设计概览

## 小节三: Vue3的设计思路

### 1. 声明式的描述UI

- Dom节点
  - 抽象: 需要对节点的标签类型,属性,事件以及树形层级结构进行抽象
  - 存在形式: vnode
  - 特点: 其tag对应了HTML中内置的标签,同时单个vnode代指对单个节点的抽象

- Component节点
  - 抽象: 需要对组件的视图,逻辑,以及样式进行抽象
  - 存在形式: vnode
  - 特点: 其tag对应了全局组件或局部组件,同时单个vnode代指对单个组件的抽象, 其返回值render代指了一组Dom节点的抽象

### 2. 初始编译器

- 用途: 用于将模版编译成render函数
- 协调性和制约性:
  - 模版编译器配合vnode以及渲染器共同完成视图的渲染
  - 模版编译器编译的结果是被vnode以及渲染器制约的

### 3. 初始渲染器

- 用途: 用于创建或者更新视图
  - 初始化时,渲染器基于vnode生成并挂载对应的dom片段
  - 更新时,渲染器基于新生成的vnode,diff旧的vnode,更新对应最小粒度的dom片段

### 4. 案例

```JS
    // 注册全局组件
    const components = new Map;
    components.set('my-component', {
        render() {
            return {
                tag: "li",
                props: {
                    onClick: () => {
                        console.log(`li: ${this.children}`)
                    }
                },
                children: "我是子组件1"
            }
        }
    })

    // 定义虚拟Vnode
    const vnode = {
        tag: 'div',
        props: {
            id: "vnode-fragment"
        },
        children: [
            {
                tag: "ul",
                children: [
                    {
                        tag: "my-component"
                    }
                ]
            }
        ]
    }

    // 定义渲染器
    function renderer(vnode, $el) {
        const component = components.get(vnode.tag);

        if (component) {
            mountComponent(component, $el)
        }else {
            mountElement(vnode, $el)
        }
    }

    // 定义挂载节点的函数
    function mountElement(vnode, $el) {
        const tags = vnode.tag || 'div',
            props = vnode.props || {}

        const el = document.createElement(vnode.tag)
        Object.keys(props).forEach(key => {
            if (/^on/ug.test(key)) {
                const eventName = key.slice(2).toLowerCase()
                el.addEventListener(eventName, props[key].bind(vnode))
            }else {
                el[key] = props[key]
            }
        })

        if (Array.isArray(vnode.children) && vnode.children.length) {
            vnode.children.forEach(vnode => renderer(vnode, el))
        }else if (typeof vnode.children === 'string') {
            const textNode = document.createTextNode(vnode.children)
            el.appendChild(textNode)
        }
        // 挂载元素
        $el.appendChild(el)
    }

    // 定义挂载组件的函数
    function mountComponent(component, $el) {
        const vnode = component.render.call(component)
        renderer(vnode, $el)
    }

    // 渲染vnode
    renderer(vnode, document.body)
```

### 注解

- 角色
  - compiler: 编译器,用于模版编译
  - render: 渲染函数,模版编译器的产物,用于对组件内要渲染的元素进行描述
  - h: 辅助生成vnode的工具函数,compiler生成的render函数,最小单位以此构成
  - vnode: vue对dom节点或者组件(一组dom节点)的抽象
  - renderer: 渲染器,用于基于vnode创建或者更新视图
