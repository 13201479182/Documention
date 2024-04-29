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

