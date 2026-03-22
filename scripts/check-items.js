// Quick script to check what's actually in Firestore rentals collection
fetch('https://firestore.googleapis.com/v1/projects/idhi-yaaparam/databases/(default)/documents:runQuery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'rentals' }],
      limit: 10
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('Total results:', data.length);
  data.forEach(item => {
    if (!item.document) { console.log('Empty result:', JSON.stringify(item)); return; }
    const f = item.document.fields || {};
    const id = item.document.name.split('/').pop();
    console.log(`\nID: ${id}`);
    console.log(`  status: ${f.status?.stringValue || 'MISSING'}`);
    console.log(`  collegeId: ${f.collegeId?.stringValue || 'MISSING'}`);
    console.log(`  itemName: ${f.itemName?.stringValue || 'MISSING'}`);
    console.log(`  categoryId: ${f.categoryId?.stringValue || 'MISSING'}`);
    console.log(`  listingType: ${f.listingType?.stringValue || 'MISSING'}`);
  });
})
.catch(err => console.error('Error:', err));
