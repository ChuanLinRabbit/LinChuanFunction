// 数字转汉字
const digits_zh = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const decimal_zh = ['','十','百','千',]
const comma_zh = ['万','亿']
// 字符分组
export function string_to_array (str,step) {
    let r = [];
    function doGroup(s) {
        if (!s) return;
        r.push(s.substr(0, step));
        s = s.substr(step);
        doGroup(s)
    }
    doGroup(str);
    return r;
}