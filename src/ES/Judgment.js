/**
 * 区间判断
 * @param value
 * @param range
 * @return {boolean|void|*}
 *
 * @example
 * isRangeIn(55,'[50,60]')
 * 中括号开区间，小括号闭区间，大括号枚举匹配，直接填入数值判断等于
 */
export const isRangeIn = function (value, range) {
    let isContainMin = false
    let isContainMax = false
    let isGTMin = false
    let isLTMax = false
    if(!range && range !== 0) return false
    if(!value && value !== 0) return false
    if(!isNaN(value)) value = Number(value)
    else return console.error('isRangeIn first param "value" is NaN')
    // 纯数字时相等为真
    if(!isNaN(range)) return value === Number(range)
    // 花括弧时，包含为真
    if(range.includes('{') && range.includes('}')) {
        let arrString = range.replace(/\{|}/g,'')
        let arr = arrString.split(',')
        arr = arr.map(item => {
            return Number(item)
        })
        return arr.includes(value)
    }
    // 位运算+幂运算（判断第几位是1）
    if(range.includes('&pow')) {
        let string = range.replace(/(&pow)/g,'')
        return !!value&Math.pow(2,string - 1)
    }
    // 位运算（与）
    if(range.includes('&')) {
        let string = range.replace(/(&)/g,'')
        return !!value&string
    }
    // 开闭区间，运算
    let rangeArr = range.split(',')
    if(rangeArr[0].includes('[')) isContainMin = true
    if(rangeArr[1].includes(']')) isContainMax = true
    let min = rangeArr[0].replace(/\[|]|\(|\)/g,'') || -Infinity
    let max = rangeArr[1].replace(/\[|]|\(|\)/g,'') || Infinity
    if(isContainMin) {
        isGTMin = value >= min
    }else {
        isGTMin = value > min
    }
    if(isContainMax) {
        isLTMax = value <= max

    }else {
        isLTMax = value < max
    }
    return isLTMax && isGTMin
}