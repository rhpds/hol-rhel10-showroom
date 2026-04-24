'use strict'

const path = require('path')
const fs = require('fs')

// Antora extension: inline buttons.js and site-extra.css into every page.
// Reads the files directly at build time — no CDN, no caching issues.

module.exports.register = function () {
  this.on('pagesComposed', ({ contentCatalog }) => {
    const pages = contentCatalog.getPages().filter((p) => p.contents && p.out)
    console.log(`[inject-buttons] pagesComposed — inlining into ${pages.length} pages`)

    const base = path.resolve(__dirname, '..', 'supplemental-ui')
    const css  = fs.readFileSync(path.join(base, 'css', 'site-extra.css'), 'utf8')
    const js   = fs.readFileSync(path.join(base, 'js', 'buttons.js'), 'utf8')

    // Directly set white-space on listingblock pre elements at runtime.
    // This overrides hljs and any theme CSS regardless of load order.
    const wrapScript = `
(function(){
  function applyWrap(){
    document.querySelectorAll('.listingblock pre').forEach(function(el){
      el.style.whiteSpace='pre-wrap';
      el.style.wordBreak='break-word';
      el.style.overflowX='visible';
      var code=el.querySelector('code');
      if(code){code.style.whiteSpace='pre-wrap';code.style.wordBreak='break-word';code.style.overflowX='visible';}
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',applyWrap);}else{applyWrap();}
})();`

    const INJECT = `<style>\n${css}\n</style>\n<script>\n${js}\n</script>\n<script>${wrapScript}</script>`

    pages.forEach((page) => {
      const html = page.contents.toString()
      if (html.includes('stream-panel') || html.includes('solve-btn')) return
      const updated = html.replace('</body>', INJECT + '\n</body>')
      if (updated !== html) page.contents = Buffer.from(updated)
    })
  })
}
