var e={chooseFile:function(e="",t){return new Promise((n=>{let c=document.createElement("input");c.type="file",e&&(c.accept=e),t&&(c.multiple=!0),c.onchange=function(){n(c.files)},c.click()}))}};export{e as Browser_File};