/**
 * Asset Library DOM Scraper - Version 2
 *
 * This version directly scrapes the visible asset data from the page
 * instead of intercepting API calls.
 *
 * USAGE:
 * 1. Open Asset Library popup in Seller Central
 * 2. Set filter to "No size restriction" to see all assets
 * 3. Scroll down to load ALL assets (until you see "End of search results")
 * 4. Click the bookmarklet to extract and copy data
 */

(function() {
  'use strict';

  const assets = [];

  // Find all asset cards in the Asset Library
  // Looking for elements that contain asset info (name, dimensions, thumbnail)
  const assetCards = document.querySelectorAll('[class*="asset"], [class*="media-card"], [class*="thumbnail"], [data-testid*="asset"], [data-testid*="media"]');

  // Try multiple selectors for Amazon's UI
  let cards = document.querySelectorAll('.media-library-asset, .asset-card, [class*="MediaCard"], [class*="AssetCard"]');

  // If no cards found, try to find by structure - look for elements with image + text
  if (cards.length === 0) {
    // Look for the grid container
    const containers = document.querySelectorAll('[class*="grid"], [class*="Gallery"], [class*="asset-list"]');
    containers.forEach(container => {
      const items = container.querySelectorAll(':scope > div');
      if (items.length > 5) {
        cards = items;
      }
    });
  }

  // Alternative: find all images with dimensions text nearby
  if (cards.length === 0) {
    // Find all text nodes that look like dimensions (e.g., "1920 x 1080")
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (/\d{3,4}\s*x\s*\d{3,4}/.test(node.textContent)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    const dimensionNodes = [];
    while (walker.nextNode()) {
      dimensionNodes.push(walker.currentNode);
    }

    // For each dimension node, find the parent card
    dimensionNodes.forEach(node => {
      let parent = node.parentElement;
      // Walk up to find a reasonable container (usually 3-5 levels up)
      for (let i = 0; i < 6 && parent; i++) {
        if (parent.querySelector('img') && parent.offsetHeight > 100) {
          // Found a card-like element
          const img = parent.querySelector('img');
          const allText = parent.textContent;

          // Extract filename (usually before dimensions)
          const dimMatch = allText.match(/(\d{3,4})\s*x\s*(\d{3,4})/);
          let filename = '';
          let width = 0, height = 0;

          if (dimMatch) {
            width = parseInt(dimMatch[1]);
            height = parseInt(dimMatch[2]);
            // Get text before dimensions
            const beforeDim = allText.substring(0, allText.indexOf(dimMatch[0])).trim();
            const lines = beforeDim.split('\n').filter(l => l.trim());
            filename = lines[lines.length - 1] || '';
          }

          // Try to get asset ID from image src or data attributes
          let assetId = '';
          if (img.src) {
            // Extract UUID from image URL
            const uuidMatch = img.src.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            if (uuidMatch) {
              assetId = uuidMatch[1];
            }
          }

          // Check data attributes
          if (!assetId) {
            const dataAttrs = parent.querySelectorAll('[data-media-id], [data-asset-id], [data-id]');
            dataAttrs.forEach(el => {
              assetId = el.getAttribute('data-media-id') || el.getAttribute('data-asset-id') || el.getAttribute('data-id') || assetId;
            });
          }

          if (filename || assetId) {
            assets.push({
              assetId: assetId,
              filename: filename.replace(/\.{3}$/, ''), // Remove trailing ...
              tags: [],
              width: width,
              height: height,
              imgSrc: img.src
            });
          }
          break;
        }
        parent = parent.parentElement;
      }
    });
  }

  // Remove duplicates by filename or assetId
  const uniqueAssets = [];
  const seen = new Set();

  assets.forEach(asset => {
    const key = asset.assetId || asset.filename;
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueAssets.push(asset);
    }
  });

  if (uniqueAssets.length === 0) {
    alert('No assets found!\n\nMake sure the Asset Library popup is open and showing assets.\n\nTry scrolling to load all assets first.');

    // Debug: log what we can find
    console.log('=== Asset Library Debug ===');
    console.log('All images:', document.querySelectorAll('img').length);
    console.log('Dimension texts found:', document.body.innerHTML.match(/\d{3,4}\s*x\s*\d{3,4}/g));
    return;
  }

  // Format for export (without imgSrc)
  const exportData = uniqueAssets.map(a => ({
    assetId: a.assetId,
    filename: a.filename,
    tags: a.tags,
    width: a.width,
    height: a.height
  }));

  const json = JSON.stringify(exportData, null, 2);

  // Copy to clipboard
  navigator.clipboard.writeText(json).then(() => {
    alert(
      `Extracted ${uniqueAssets.length} assets!\n\n` +
      `Data copied to clipboard.\n\n` +
      `Go to Google Sheets:\n` +
      `LUKO > Export to Amazon > Import from Asset Library`
    );
  }).catch(() => {
    // Fallback - show in prompt
    console.log('Asset Library Export:', json);
    prompt('Copy this JSON (Ctrl+A, Ctrl+C):', json);
  });

})();


/**
 * MINIFIED BOOKMARKLET - Copy this entire line as bookmark URL:
 */

// javascript:(function(){'use strict';var assets=[];var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){if(/\d{3,4}\s*x\s*\d{3,4}/.test(node.textContent))return NodeFilter.FILTER_ACCEPT;return NodeFilter.FILTER_REJECT}});var dimNodes=[];while(walker.nextNode())dimNodes.push(walker.currentNode);dimNodes.forEach(function(node){var parent=node.parentElement;for(var i=0;i<6&&parent;i++){if(parent.querySelector('img')&&parent.offsetHeight>100){var img=parent.querySelector('img');var allText=parent.textContent;var dimMatch=allText.match(/(\d{3,4})\s*x\s*(\d{3,4})/);var filename='',width=0,height=0;if(dimMatch){width=parseInt(dimMatch[1]);height=parseInt(dimMatch[2]);var beforeDim=allText.substring(0,allText.indexOf(dimMatch[0])).trim();var lines=beforeDim.split('\n').filter(function(l){return l.trim()});filename=lines[lines.length-1]||''}var assetId='';if(img.src){var uuidMatch=img.src.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);if(uuidMatch)assetId=uuidMatch[1]}if(filename||assetId)assets.push({assetId:assetId,filename:filename.replace(/\.{3}$/,''),tags:[],width:width,height:height});break}parent=parent.parentElement}});var unique=[],seen=new Set();assets.forEach(function(a){var key=a.assetId||a.filename;if(key&&!seen.has(key)){seen.add(key);unique.push(a)}});if(!unique.length){alert('No assets found! Make sure Asset Library is open.');return}var json=JSON.stringify(unique,null,2);navigator.clipboard.writeText(json).then(function(){alert('Extracted '+unique.length+' assets to clipboard!\\n\\nGo to: LUKO > Export to Amazon > Import from Asset Library')}).catch(function(){prompt('Copy this JSON:',json)})})();
