/**
 * 选择文件
 * @param [acceptType]
 * @param multiple
 * @return {Promise<[File]>}
 */
export function chooseFile(acceptType = '', multiple) {
    return new Promise((resolve) => {
        let input = document.createElement("input")
        input.type = 'file'
        if(acceptType) input.accept = acceptType
        if(multiple) input.multiple = true
        input.onchange = function () {
            resolve(input.files)
        }
        input.click()
    })
}

export default {
    chooseFile
}