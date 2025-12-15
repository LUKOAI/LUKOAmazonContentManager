/**
 * Asset Library Extractor Bookmarklet
 *
 * Extracts asset data (ID, filename, tags, dimensions) from Amazon Seller Central's
 * A+ Content Media Library for import into LUKO Amazon Content Manager.
 *
 * INSTALLATION:
 * 1. Create a new bookmark in your browser
 * 2. Set the name to: "Extract Asset Library"
 * 3. Set the URL to the minified bookmarklet code below (starts with javascript:)
 *
 * USAGE:
 * 1. Go to Seller Central > A+ Content Manager > Media Library (Asset Library)
 * 2. Click the bookmarklet to START capturing
 * 3. Scroll through all your assets to load them (pagination loads as you scroll)
 * 4. Click the bookmarklet again to EXPORT the captured data
 * 5. Paste the JSON into Google Sheets (LUKO > Import from Asset Library)
 */

(function() {
  'use strict';

  // Check if we're already running
  if (window.__assetLibraryExtractor) {
    // Export mode - collect and copy data
    const assets = window.__assetLibraryExtractor.getAssets();

    if (assets.length === 0) {
      alert('No assets captured yet!\n\nScroll through the Asset Library to load assets, then click again to export.');
      return;
    }

    // Format for import
    const exportData = assets.map(asset => ({
      assetId: asset.assetId,
      filename: asset.filename,
      tags: asset.tags || [],
      width: asset.width,
      height: asset.height
    }));

    const json = JSON.stringify(exportData, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      alert(
        `Exported ${assets.length} assets to clipboard!\n\n` +
        `Now go to Google Sheets:\n` +
        `LUKO Amazon Manager > Export to Amazon > Import from Asset Library\n\n` +
        `Paste the JSON when prompted.`
      );

      // Clean up
      window.__assetLibraryExtractor.cleanup();
      delete window.__assetLibraryExtractor;
    }).catch(err => {
      // Fallback - show in textarea for manual copy
      const textarea = document.createElement('textarea');
      textarea.value = json;
      textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:80%;z-index:999999;font-family:monospace;font-size:12px;';
      document.body.appendChild(textarea);
      textarea.select();

      alert(
        `Found ${assets.length} assets!\n\n` +
        `Clipboard access failed. The JSON is shown in a text area.\n` +
        `Press Ctrl+A then Ctrl+C to copy, then close this dialog and click elsewhere to close the textarea.`
      );

      textarea.addEventListener('blur', () => {
        textarea.remove();
        window.__assetLibraryExtractor.cleanup();
        delete window.__assetLibraryExtractor;
      });
    });

    return;
  }

  // Initialize extractor
  const collectedAssets = new Map();
  const originalFetch = window.fetch;
  const originalXHR = XMLHttpRequest.prototype.open;

  // Hook fetch
  window.fetch = async function(url, options) {
    const response = await originalFetch.apply(this, arguments);

    try {
      if (typeof url === 'string' && (
        url.includes('searchMediaMetadata') ||
        url.includes('getMediaMetadata') ||
        url.includes('media-library')
      )) {
        const clone = response.clone();
        clone.json().then(data => processResponse(data)).catch(() => {});
      }
    } catch (e) {}

    return response;
  };

  // Hook XHR
  XMLHttpRequest.prototype.open = function(method, url) {
    const xhr = this;

    if (typeof url === 'string' && (
      url.includes('searchMediaMetadata') ||
      url.includes('getMediaMetadata') ||
      url.includes('media-library')
    )) {
      xhr.addEventListener('load', function() {
        try {
          const data = JSON.parse(xhr.responseText);
          processResponse(data);
        } catch (e) {}
      });
    }

    return originalXHR.apply(this, arguments);
  };

  function processResponse(data) {
    // Handle different response structures
    let assets = [];

    if (data.mediaMetadataRecords) {
      assets = data.mediaMetadataRecords;
    } else if (data.results) {
      assets = data.results;
    } else if (data.media) {
      assets = data.media;
    } else if (Array.isArray(data)) {
      assets = data;
    }

    for (const asset of assets) {
      // Try to extract asset ID from various fields
      let assetId = asset.mediaId || asset.assetId || asset.id || asset.uploadDestinationId || '';

      // Clean up the ID if it's a full path
      if (assetId.includes('/')) {
        assetId = assetId.split('/').pop();
      }

      if (!assetId) continue;

      // Extract filename
      let filename = asset.fileName || asset.filename || asset.name || '';
      if (!filename && asset.uploadDestinationId) {
        filename = asset.uploadDestinationId.split('/').pop();
      }
      if (!filename && assetId.includes('.')) {
        filename = assetId;
      }

      // Extract dimensions
      let width = asset.width || 0;
      let height = asset.height || 0;

      if (asset.dimensions) {
        width = asset.dimensions.width || width;
        height = asset.dimensions.height || height;
      }
      if (asset.imageMetadata) {
        width = asset.imageMetadata.width || width;
        height = asset.imageMetadata.height || height;
      }

      // Extract tags
      let tags = [];
      if (Array.isArray(asset.tags)) {
        tags = asset.tags;
      } else if (asset.keywords) {
        tags = Array.isArray(asset.keywords) ? asset.keywords : [asset.keywords];
      } else if (asset.labels) {
        tags = Array.isArray(asset.labels) ? asset.labels : [asset.labels];
      }

      collectedAssets.set(assetId, {
        assetId,
        filename,
        tags,
        width,
        height
      });
    }

    updateStatusBadge();
  }

  function updateStatusBadge() {
    let badge = document.getElementById('__assetExtractorBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = '__assetExtractorBadge';
      badge.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #232f3e;
        color: #ff9900;
        padding: 10px 15px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      badge.title = 'Click to export assets';
      badge.onclick = () => window.__assetLibraryExtractor && window.__assetLibraryExtractor.getAssets().length > 0 && eval(document.querySelector('a[href^="javascript:"]')?.href);
      document.body.appendChild(badge);
    }
    badge.innerHTML = `
      <span style="color:#fff;">Asset Extractor:</span>
      <span style="color:#ff9900;">${collectedAssets.size}</span>
      <span style="color:#fff;font-size:12px;opacity:0.8;">assets</span>
      <br><span style="font-size:11px;color:#aaa;">Scroll to load more, click bookmarklet to export</span>
    `;
  }

  function cleanup() {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXHR;
    const badge = document.getElementById('__assetExtractorBadge');
    if (badge) badge.remove();
  }

  // Expose API
  window.__assetLibraryExtractor = {
    getAssets: () => Array.from(collectedAssets.values()),
    cleanup
  };

  // Show initial status
  updateStatusBadge();

  alert(
    'Asset Library Extractor STARTED!\n\n' +
    '1. Scroll through the Asset Library to load all assets\n' +
    '2. Watch the counter in the top-right corner\n' +
    '3. Click the bookmarklet again when ready to EXPORT\n\n' +
    'The extractor is now capturing asset data from API responses.'
  );

})();


/**
 * MINIFIED BOOKMARKLET CODE
 * Copy everything below (including "javascript:") and paste as bookmark URL:
 */

// BOOKMARKLET START - Copy from here:
// javascript:(function(){'use strict';if(window.__ale){var a=window.__ale.get();if(!a.length)return alert('No assets captured!\n\nScroll through Asset Library to load assets, then click again.');var j=JSON.stringify(a.map(function(x){return{assetId:x.assetId,filename:x.filename,tags:x.tags||[],width:x.width,height:x.height}}),null,2);navigator.clipboard.writeText(j).then(function(){alert('Exported '+a.length+' assets!\n\nGo to Google Sheets:\nLUKO > Export to Amazon > Import from Asset Library');window.__ale.stop();delete window.__ale}).catch(function(){prompt('Copy this JSON:',j);window.__ale.stop();delete window.__ale});return}var m=new Map,oF=window.fetch,oX=XMLHttpRequest.prototype.open;function proc(d){var arr=d.mediaMetadataRecords||d.results||d.media||(Array.isArray(d)?d:[]);arr.forEach(function(x){var id=x.mediaId||x.assetId||x.id||x.uploadDestinationId||'';if(id.includes('/'))id=id.split('/').pop();if(!id)return;var fn=x.fileName||x.filename||x.name||'';if(!fn&&x.uploadDestinationId)fn=x.uploadDestinationId.split('/').pop();var w=x.width||0,h=x.height||0;if(x.dimensions){w=x.dimensions.width||w;h=x.dimensions.height||h}if(x.imageMetadata){w=x.imageMetadata.width||w;h=x.imageMetadata.height||h}var t=Array.isArray(x.tags)?x.tags:x.keywords?[].concat(x.keywords):x.labels?[].concat(x.labels):[];m.set(id,{assetId:id,filename:fn,tags:t,width:w,height:h})});upd()}function upd(){var b=document.getElementById('__aleBadge');if(!b){b=document.createElement('div');b.id='__aleBadge';b.style.cssText='position:fixed;top:10px;right:10px;background:#232f3e;color:#ff9900;padding:12px 18px;border-radius:8px;font:bold 14px Arial;z-index:999999;box-shadow:0 2px 10px rgba(0,0,0,.3)';document.body.appendChild(b)}b.innerHTML='<span style="color:#fff">Asset Extractor:</span> <b>'+m.size+'</b><br><small style="color:#aaa">Scroll to load, click bookmarklet to export</small>'}window.fetch=async function(u,o){var r=await oF.apply(this,arguments);try{if(typeof u==='string'&&(u.includes('searchMediaMetadata')||u.includes('getMediaMetadata')||u.includes('media-library')))r.clone().json().then(proc).catch(function(){})}catch(e){}return r};XMLHttpRequest.prototype.open=function(method,u){var x=this;if(typeof u==='string'&&(u.includes('searchMediaMetadata')||u.includes('getMediaMetadata')||u.includes('media-library')))x.addEventListener('load',function(){try{proc(JSON.parse(x.responseText))}catch(e){}});return oX.apply(this,arguments)};window.__ale={get:function(){return Array.from(m.values())},stop:function(){window.fetch=oF;XMLHttpRequest.prototype.open=oX;var b=document.getElementById('__aleBadge');if(b)b.remove()}};upd();alert('Asset Library Extractor STARTED!\n\n1. Scroll through Asset Library to load all assets\n2. Watch counter in top-right\n3. Click bookmarklet again to EXPORT')})();
// BOOKMARKLET END
