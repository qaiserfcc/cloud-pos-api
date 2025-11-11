const fs = require('fs');

// Read the collection file
const collectionPath = '/Users/qaisu/Downloads/cloud-pos-release/cloud-pos-api/cloud-pos-api.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Function to fix path arrays by removing 'api' and 'v1' entries
function fixPathArray(pathArray) {
  return pathArray.filter(segment => segment !== 'api' && segment !== 'v1');
}

// Recursively process all items in the collection
function processItems(items) {
  items.forEach(item => {
    if (item.item) {
      // This is a folder, process its children
      processItems(item.item);
    } else if (item.request && item.request.url && item.request.url.path) {
      // This is a request, fix its path array
      const originalPath = item.request.url.path;
      const fixedPath = fixPathArray(originalPath);

      if (JSON.stringify(originalPath) !== JSON.stringify(fixedPath)) {
        console.log(`Fixing ${item.name}:`);
        console.log(`  Before: ${JSON.stringify(originalPath)}`);
        console.log(`  After:  ${JSON.stringify(fixedPath)}`);
        item.request.url.path = fixedPath;
      }
    }
  });
}

// Process all items in the collection
processItems(collection.item);

// Write the fixed collection back to file
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Collection path arrays fixed successfully!');