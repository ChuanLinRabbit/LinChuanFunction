export const getTreeByList = function (list, extendProps = {}, ) {
    let props = {
        id: 'id',
        children: 'children',
        parentId: 'parentId'
    }
    Object.assign(props,extendProps)
    list.forEach((parent) => {
        parent.tempChildren = list.filter(child => child[props.parentId] === parent[props.id] && parent[props.id] && child[props.parentId])
        parent.tempChildren.forEach(item => {item._hasParent = true})
        if(parent[props.children]) parent[props.children] = parent[props.children].concat(parent.tempChildren)
        else {
            parent[props.children] = parent.tempChildren
            delete parent.tempChildren
        }
    })
    let result = list.filter(item => !item._hasParent)
    list.forEach(item => {
        delete item._hasParent
    })
    return result
}

/**
 * 为list设置parentIds
 * @param list
 */
export const setParentIds4List = function (list) {
    list.forEach(data => {
        let parentIds = []
        let nextParentId = data.parentId
        while (nextParentId) {
            parentIds.push(nextParentId)
            let parentNode = list.find(item => item.id === nextParentId)
            if(parentNode) nextParentId = parentNode.parentId
            else nextParentId = null
        }
        data._parentIds = parentIds.reverse()
    })
}