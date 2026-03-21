/**
 * scripts/seedCategories.ts
 *
 * Seeds all required categories into Firestore.
 * Safe to run multiple times (uses merge: true).
 *
 * Usage (from project root):
 *   npx ts-node --project tsconfig.json scripts/seedCategories.ts
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const categories = [
  {
    id: 'cat-calculator',
    name: 'Calculator',
    icon: 'Calculator',
    color: 'bg-blue-50 text-blue-600',
    keywords: ['calculator', 'casio', 'scientific', 'fx-991'],
  },
  {
    id: 'cat-drafter',
    name: 'Drafter',
    icon: 'Ruler',
    color: 'bg-orange-50 text-orange-600',
    keywords: ['drafter', 'drawing board', 'drafting', 'mini drafter'],
  },
  {
    id: 'cat-labcoat',
    name: 'Lab Coat',
    icon: 'Shirt',
    color: 'bg-green-50 text-green-600',
    keywords: ['lab coat', 'labcoat', 'apron', 'white coat'],
  },
  {
    id: 'cat-geometry',
    name: 'Geometry Set',
    icon: 'Triangle',
    color: 'bg-purple-50 text-purple-600',
    keywords: ['geometry', 'compass', 'protractor', 'set square'],
  },
  {
    id: 'cat-books',
    name: 'Books/Notes',
    icon: 'BookOpen',
    color: 'bg-yellow-50 text-yellow-600',
    keywords: ['book', 'notes', 'textbook', 'notebook', 'guide'],
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    icon: 'Laptop',
    color: 'bg-red-50 text-red-600',
    keywords: ['laptop', 'phone', 'charger', 'earphone', 'powerbank', 'electronic', 'gadget'],
  },
  {
    id: 'cat-tools',
    name: 'Tools',
    icon: 'Wrench',
    color: 'bg-gray-50 text-gray-600',
    keywords: ['tool', 'wrench', 'hammer', 'screwdriver'],
  },
  {
    id: 'cat-others',
    name: 'Others',
    icon: 'Package',
    color: 'bg-slate-50 text-slate-600',
    keywords: [],
  },
];

const seedCategories = async () => {
  if (!db) {
    console.error('Firebase db is not initialised. Check lib/firebase.ts.');
    process.exit(1);
  }
  console.log('Seeding categories...');
  for (const cat of categories) {
    await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
    console.log(`✓ Created: ${cat.name}`);
  }
  console.log('\nDone! All categories created.');
};

seedCategories();
