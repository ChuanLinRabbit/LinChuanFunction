/**
 * 统一获取异步数据
 * @param promiseMap
 * @param myFuncMap
 * @return {Promise<{}>}
 */
export async function getPromiseDataMap(promiseMap, myFuncMap) {
    if(!promiseMap) return Promise.resolve({})
    const PromiseList = []
    const dataMap = {}
    for(let key in promiseMap) {
        let funcName = promiseMap[key]
        let funcMap = Object.assign({}, defaultHooks, myFuncMap)
        if(funcMap[funcName]) {
            let promiseInstance = funcMap[funcName]()
            PromiseList.push(promiseInstance)
            promiseInstance.then(res => {
                dataMap[key] = res
            })
        }
    }
    await Promise.all(PromiseList)
    return Promise.resolve(dataMap)
}

/**
 * 获得解析后的直观配置
 * @param data
 * @param params
 */
export function getTransOption(data, params) {
    if(['[object Object]','[object Array]'].includes(Object.prototype.toString.call(data))) {
        let container = null
        let filterData = null
        if(Object.prototype.toString.call(data) === '[object Array]') {
            container = []
            filterData = []
        }
        if(Object.prototype.toString.call(data) === '[object Object]') {
            container = {}
            filterData = {}
        }
        // 过滤没有权限或者需要隐藏的项目
        for(let key in data) {
            if(Object.prototype.toString.call(data[key]) === '[object Object]') {
                let hidden = false
                if(data[key].hidden) {
                    if(data[key].hidden && type(data[key].hidden) === 'String') {
                        hidden = seesTrans(data[key].hidden, params)
                    }
                    if(data[key].hidden && type(data[key].hidden) === 'Boolean') {
                        hidden = data[key].hidden
                    }
                    if(data[key].hidden && type(data[key].hidden) === 'Object') {
                        hidden = match(data[key].hidden, params.dataMap, params.funcMap)
                    }
                    if(!hidden && hasPerms(data[key])) {
                        filterData[key] = clone(data[key])
                        delete filterData[key].hidden
                    }
                }else {
                    if(hasPerms(data[key])) {
                        filterData[key] = data[key]
                    }
                }
            }else {
                filterData[key] = data[key]
            }
        }
        if(Object.prototype.toString.call(container) === '[object Array]') {
            for(let key in filterData) {
                params.key = key
                params.parent = container
                let tempResult = getTransOption(filterData[key], params)
                if(tempResult !== undefined) container.push(getTransOption(filterData[key], params))
            }
        }
        if(Object.prototype.toString.call(container) === '[object Object]') {
            for(let key in filterData) {
                params.key = key
                params.parent = container
                container[key] = getTransOption(filterData[key], params)
            }
        }
        return container
    }
    if(type(data) === 'String') return seesTrans(data, params)
    return data
}

/**
 * 获取翻译后的设置
 * @returns {Promise<void>}
 */
export async function getAsyncSchema(option, myFuncMap = {}) {
    let dictMap = {}
    let promiseMap = {}
    let funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let promise1 = getDictMap(option.dict).then(res => {
        dictMap = res
    })
    let promise2 = getPromiseDataMap(option.promise, funcMap).then(res => {
        promiseMap = res
    })
    await Promise.all([promise1, promise2])
    return Promise.resolve({...dictMap, ...promiseMap})
}

/**
 * 根据后端数据，反解前端数据
 * @param cells
 * @param data
 * @return {*}
 */
export function changeDataByItems(cells, data) {
    // todo plusMap为数组的情况未处理，可以扩展plusArray,packMap,packArray字段
    for(let tr of cells) {
        for(let cell of tr) {
            if(cell.plusMap) {
                for(let remoteKey in cell.plusMap) {
                    let value = data[remoteKey]
                    if(!value) continue
                    if(cell.enum) continue
                    let frontKey = cell.plusMap[remoteKey]
                    if(!data[cell.key]) data[cell.key] = {}
                    data[cell.key][frontKey] = data[remoteKey]
                }
            }
            if(cell.pickMap && match(cell, data)) {
                for(let remoteKey in cell.pickMap) {
                    let value = data[remoteKey]
                    if(!value) continue
                    let keyMap = cell.pickMap[remoteKey]
                    if(!data[cell.key]) data[cell.key] = []
                    data[cell.key] = data[remoteKey].map(item => {
                        for(let pickMapItemKey in keyMap) {
                            let pickMapItemValue = keyMap[pickMapItemKey]
                            if(pickMapItemValue === 'id')
                                return item[pickMapItemKey]
                        }
                    })
                }
            }
            if(cell.dateFormat) {
                if(cell.rangeKey) {
                    let value1 = data[cell.rangeKey[0]]
                    let value2 = data[cell.rangeKey[1]]
                    if(value1 && value2) {
                        data[cell.key] = [dayjs(value1).format(cell.dateFormat), dayjs(value2).format(cell.dateFormat)]
                        data[cell.rangeKey[0]] = dayjs(value1).format(cell.dateFormat)
                        data[cell.rangeKey[1]] = dayjs(value2).format(cell.dateFormat)
                    }
                }else {
                    let value = data[cell.key]
                    if(!value) continue
                    data[cell.key] = dayjs(value).format(cell.dateFormat)
                }
            }
        }
    }
    return data
}

/**
 * 转换data为should形式
 * @param searchItems
 * @param sendData
 * @return {*[]}
 */
export function chargeSendData2Should(searchItems, sendData) {
    let should = []
    let searchItemsMap = indexBy(prop('key'),searchItems)
    for(let key in sendData) {
        let config = searchItemsMap[key]
        if(config.condition && sendData[key]) {
            if(config.tag === 'radio' || config.tag === 'input') {
                should.push([value2Must(config, sendData[key])])
            }
            if(config.tag === 'checkbox') {
                let valueArr = sendData[key].split(',')
                should.push(valueArr.map(value2Must(config)))
            }
        }
    }
    return should
}

/**
 * 将多选转换成shouldItem
 * @param config
 * @param val
 * @return {{}}
 */
export const value2Must = curry(value2Must_Root)
function value2Must_Root(config, val) {
    if(!val) return {}
    return {
        key: config.key,
        condition: config.condition,
        value: val
    }
}

/**
 * 通过items配置获取must参数
 * @param items
 * @param data
 * @param keys
 * @return {*[]}
 */
export function getMust(items, data, keys) {
    let must = []
    items.forEach(item => {
        if(keys && !keys.includes(item.key)) return
        let value = data[item.key]
        if(!value && value !== 0) return
        if(item.toNum) value = Number(value)
        if(item.condition === 'range' && value.length === 2) {
            must.push({
                key: item.key,
                value: value[0],
                condition: 'ge'
            })
            must.push({
                key: item.key,
                value: value[1],
                condition: 'le'
            })
        }
        else {
            let condition = item.condition ?? 'eq'
            must.push({
                key: item.key,
                value: value,
                condition: condition
            })
        }
    })
    return must
}