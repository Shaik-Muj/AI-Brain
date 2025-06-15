// This script copies PDF.js worker files to the public directory
// This ensures they're available at runtime for the browser

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source path from node_modules
const sourceDir = path.resolve(__dirname, 'node_modules', 'pdfjs-dist', 'build');
const destDir = path.resolve(__dirname, 'public', 'pdf-worker');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Files to copy
const files = [
  'pdf.worker.min.js',
  'pdf.worker.js',
];

// Copy each file
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  // Check if source exists
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to public/pdf-worker/`);
  } else {
    console.error(`Source file not found: ${sourcePath}`);
  }
});

// Also copy the CMaps folder for full PDF support
const sourceCMapsDir = path.resolve(__dirname, 'node_modules', 'pdfjs-dist', 'cmaps');
const destCMapsDir = path.resolve(__dirname, 'public', 'pdf-worker', 'cmaps');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destCMapsDir)) {
  fs.mkdirSync(destCMapsDir, { recursive: true });
  console.log(`Created directory: ${destCMapsDir}`);
}

// Copy CMaps files if the directory exists
if (fs.existsSync(sourceCMapsDir)) {
  const cmapFiles = fs.readdirSync(sourceCMapsDir);
  
  cmapFiles.forEach(file => {
    const sourcePath = path.join(sourceCMapsDir, file);
    const destPath = path.join(destCMapsDir, file);
    
    fs.copyFileSync(sourcePath, destPath);
  });
  
  console.log(`Copied ${cmapFiles.length} CMap files to public/pdf-worker/cmaps/`);
} else {
  console.error(`CMaps directory not found: ${sourceCMapsDir}`);
}

console.log('PDF.js worker files copied successfully!');
