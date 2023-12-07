/**
 * 获取符合openApi中$Ref格式的内容
 * @param {Object} target
 * @param {String} refName
 * @param {String} splitString
 */
export function queryDefinitionByRef(target, refName, splitString = '/') {
    let refArray = refName?.split(splitString)
    refArray.shift() // 抛出"#"
    let tempSchema = target
    while(refArray.length > 0) {
        if(!tempSchema) return tempSchema
        let tempKey = refArray.shift()
        if(tempKey === '$JSONParse') {
            try {
                tempSchema = JSON.parse(tempSchema)
            }catch (e) {
                return tempSchema
            }
        }else {
            if(typeof tempSchema !== 'object') {
                if (!tempSchema && tempSchema !== 0) return ''
                return tempSchema
            }
            // todo __将不再支持
            if(tempKey.includes('__')) {
                tempSchema = tempSchema[tempKey.replace('__', '')]
            }else {
                tempSchema = tempSchema[tempKey]
            }
        }
    }
    return tempSchema
}

/**
 * 设置符合openApi中$Ref格式的内容
 * @param {Object} target
 * @param {String} refName
 * @param {Any} value
 * @param {String} splitString
 */
export function setDefinitionByRef(target, refName, value, splitString = '/') {
    let refArray = refName?.split(splitString)
    refArray.shift() // 抛出"#"
    let tempSchema = target
    while(refArray.length > 1) {
        if(typeof tempSchema !== 'object') {
            console.error(`${tempSchema} is not object`)
        }
        let tempKey = refArray.shift()
        if(tempKey.includes('__')) tempKey = tempKey.replace('__', '')
        if(!tempSchema[tempKey] && refArray[0].includes('__')) tempSchema[tempKey] = []
        else if(!tempSchema[tempKey]) tempSchema[tempKey] = {}
        tempSchema = tempSchema[tempKey]
    }
    let tempKey = refArray.shift()
    tempSchema[tempKey] = value
    return true
}

/**
 * 判断一个对象是否符合要求
 * @param {{key,value,condition,prop,eval,enum,dateFormat,must,should,matchFuncName}} config
 * @param {{}} data
 * @param {{}} [myFuncMap]
 * @return {boolean|*}
 */
export function match(config, data, myFuncMap = {}) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    if(config.must) {
        return checkMust(config.must, data, funcMap)
    }
    if(config.should) {
        return checkShould(config.should, data, funcMap)
    }
    if(config.condition) {
        let left = config.left
        let right = config.right || config.value
        if(config.key) {
            if(typeof config.key === "string") {
                config.prop = config.key
                left = chargeValue(config, data)
            }else {
                left = config.key
            }
        }
        // todo matchFuncName将弃用，不再使用，兼容旧代码
        if(config.matchFuncName) {
            right = funcMap[config.matchFuncName](data)
        }
        if(config.rightFuncName) {
            right = funcMap[config.rightFuncName](data)
        }
        if(config.leftFuncName) {
            left = funcMap[config.leftFuncName](data)
        }
        if(config.condition === 'eq') {
            return left === right
        }
        if(config.condition === 'neq') {
            return left !== right
        }
        if(config.condition === 'in') {
            if(['String', 'Array'].includes(type(right))) {
                return right?.includes(left)
            }else {
                console.error(`${right} is not String|Array`)
            }
        }
        if(config.condition === 'nin') {
            if(['String', 'Array'].includes(type(right))) {
                return !right?.includes(left)
            }else {
                console.error(`${right} is not String|Array`)
            }
        }
        if(config.condition === 'has') {
            if(['String', 'Array'].includes(type(left))) {
                return left?.includes(right)
            }else {
                console.error(`${left} is not String|Array`)
            }
        }
        if(config.condition === 'nhas') {
            if(['String', 'Array'].includes(type(left))) {
                return !left?.includes(right)
            }else {
                console.error(`${left} is not String|Array`)
            }
        }
        if(config.condition === 'exist') {
            return !!left
        }
        if(config.condition === 'nexist') {
            return !left
        }
    }
    if(config.matchFuncName) {
        return funcMap[config.matchFuncName](data)
    }
    if(config.canIUse) {
        return funcMap[config.canIUse](data)
    }
    return true
}

/**
 * 通用条件判断must
 */
export function checkMust(must, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let result = []
    for(let item of must) {
        result.push(match(item, row, funcMap))
    }
    return !result.includes(false)
}

/**
 * 通用条件判断should
 */
export function checkShould(should, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let result = []
    for(let item of should) {
        result.push(match(item, row, funcMap))
    }
    return result.includes(true)
}

/**
 * 微编译
 * @param {string} keyword
 * @param option
 * @return {null|*}
 */
export function seesTrans(keyword, option = {funcMap: {}, dictMap: {}, schema: {}, tansPromiseList: [], key: '', parent: {}, evalProp: {}, dataMap: {}}) {
    option.funcMap = Object.assign({}, defaultHooks, option.funcMap)
    // todo __promise__将弃用
    // if (keyword.includes('__promise__')) {
    //     let funcName = keyword.replace('__promise__', '')
    //     if (option.funcMap[funcName]) {
    //         let promiseInstance = option.funcMap[funcName]()
    //         option.tansPromiseList.push(promiseInstance)
    //         promiseInstance.then(res => {
    //             option.parent[option.key] = res
    //         })
    //     }
    //     return null
    // }
    if (keyword.includes('__dataMap__')) {
        let dataKey = keyword.replace('__dataMap__', '')
        if (option.dataMap[dataKey]) {
            return option.dataMap[dataKey]
        }else {
            return null
        }
    }
    if (keyword.includes('__color__')) {
        let colorPath = keyword.replace('__color__', '#/')
        return queryDefinitionByRef(color, colorPath)
    }
    if (keyword.includes('__getter__')) {
        let funcName = keyword.replace('__getter__', '')
        if (option.funcMap[funcName]) {
            return option.funcMap[funcName]()
        }else {
            return null
        }
    }
    if (keyword.includes('__funcPointer__')) {
        let funcName = keyword.replace('__funcPointer__', '')
        if (option.funcMap[funcName]) {
            return option.funcMap[funcName]
        }else {
            return () => {}
        }
    }
    // todo __dict__将弃用
    // if (keyword.includes('__dict__')) {
    //     let dictKey = keyword.replace('__dict__', '')
    //     return option.dictMap.value[dictKey]
    // }
    if (keyword.includes('__schema__')) {
        let schemaName = keyword.replace('__schema__', '')
        return option.schema[schemaName] || keyword
    }
    if (keyword.includes('__schemaFlat__')) {
        let schemaName = keyword.replace('__schemaFlat__', '')
        let index = option.parent.findIndex(item => item === keyword)
        option.parent.splice(index, 0, ...option.schema[schemaName])
        return undefined
    }
    if (keyword.includes('__eval__')) {
        let funStr = keyword.replace('__eval__', '')
        let func = new Function(...Object.keys(option.evalProp), `return ${funStr}`)
        return func(...Object.values(option.evalProp))
    }
    return keyword
}

/**
 * 值解析
 * @param {{}} config
 * @param {{}} row
 * @param {{}} [myFuncMap]
 * @return {*}
 */
export function chargeValue(config, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let _value = ''
    if (config.prop.includes('#/')) {
        _value = queryDefinitionByRef(row, config.prop)
    } else {
        _value = row[config.prop]
    }
    if (config.eval) {
        _value = new Function('row', '_value' , `return ${config.eval}`)(row, _value)
    }else if (config.enum) {
        let findItem = config.enum.find(item => item.id === _value)
        if(findItem) _value = findItem?.name
    }else if (config.funcName) {
        let func = funcMap[config.funcName]
        if(func) _value = func(row, _value)
    }
    // 格式处理 日期
    if (config.dateFormat) {
        if(config.rangeKey) {
            _value = row[config.rangeKey[0]] + '~' + row[config.rangeKey[1]]
        } else if(_value) {
            _value = dayjs(_value).format(config.dateFormat)
        }
    }

    return _value
}
