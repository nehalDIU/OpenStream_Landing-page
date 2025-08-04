#!/usr/bin/env node

// Import verification script for OpenStream Admin Dashboard
// Checks if all imports are working correctly

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying imports and exports...\n')

// Check if files exist
const filesToCheck = [
  'components/optimized/lazy-components.tsx',
  'components/optimized/simple-lazy-loading.tsx',
  'app/admin/layout.tsx',
  'app/admin/overview/page.tsx',
  'app/admin/access-codes/page.tsx'
]

let allFilesExist = true

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - NOT FOUND`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n❌ Some files are missing!')
  process.exit(1)
}

// Check exports in lazy-components.tsx
console.log('\n📦 Checking exports in lazy-components.tsx:')
const lazyComponentsContent = fs.readFileSync('components/optimized/lazy-components.tsx', 'utf8')

const expectedExports = [
  'useComponentPerformance',
  'useMemoryOptimization',
  'PerformanceOptimized',
  'useIntersectionLazyLoad'
]

expectedExports.forEach(exportName => {
  if (lazyComponentsContent.includes(`export function ${exportName}`)) {
    console.log(`✅ ${exportName} - exported`)
  } else {
    console.log(`❌ ${exportName} - NOT EXPORTED`)
  }
})

// Check imports in admin files
console.log('\n📥 Checking imports in admin files:')

const adminFiles = [
  {
    file: 'app/admin/layout.tsx',
    expectedImports: ['useMemoryOptimization']
  },
  {
    file: 'app/admin/overview/page.tsx',
    expectedImports: ['PerformanceOptimized', 'useComponentPerformance']
  },
  {
    file: 'app/admin/access-codes/page.tsx',
    expectedImports: ['useComponentPerformance']
  }
]

adminFiles.forEach(({ file, expectedImports }) => {
  console.log(`\n📄 ${file}:`)
  const content = fs.readFileSync(file, 'utf8')
  
  expectedImports.forEach(importName => {
    if (content.includes(importName)) {
      console.log(`  ✅ ${importName} - imported`)
    } else {
      console.log(`  ❌ ${importName} - NOT IMPORTED`)
    }
  })
})

// Check for common import issues
console.log('\n🔍 Checking for common import issues:')

const commonIssues = [
  {
    pattern: /import.*from.*lazy-components.*useComponentPerformance/,
    description: 'useComponentPerformance import from lazy-components'
  },
  {
    pattern: /import.*from.*simple-lazy-loading/,
    description: 'Imports from simple-lazy-loading (should be lazy-components)'
  }
]

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8')
    
    commonIssues.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        console.log(`✅ ${file}: ${description}`)
      }
    })
  }
})

console.log('\n✅ Import verification complete!')
console.log('\n💡 If you see any issues above, they need to be fixed before the app will work properly.')
console.log('🚀 If all checks pass, the development server should start without import errors.')
