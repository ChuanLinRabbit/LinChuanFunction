"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e={chooseFile:function(e="",t){return new Promise((c=>{let i=document.createElement("input");i.type="file",e&&(i.accept=e),t&&(i.multiple=!0),i.onchange=function(){c(i.files)},i.click()}))}};exports.Browser_File=e;
