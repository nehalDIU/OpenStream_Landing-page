#!/usr/bin/env node

// Bundle Analysis Script for OpenStream Admin Dashboard
// Analyzes bundle size, identifies optimization opportunities

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Analyzing bundle size and performance...\n')

// Build with bundle analyzer
console.log('📦 Building with bundle analyzer...')
try {
  execSync('ANALYZE=true npm run build', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}

// Analyze build output
const buildDir = path.join(process.cwd(), '.next')
const staticDir = path.join(buildDir, 'static')

if (!fs.existsSync(staticDir)) {
  console.error('❌ Build directory not found')
  process.exit(1)
}

// Get bundle sizes
function getDirectorySize(dirPath) {
  let totalSize = 0
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath)
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath)
      files.forEach(file => {
        calculateSize(path.join(currentPath, file))
      })
    } else {
      totalSize += stats.size
    }
  }
  
  calculateSize(dirPath)
  return totalSize
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Analyze chunks
const chunksDir = path.join(staticDir, 'chunks')
if (fs.existsSync(chunksDir)) {
  console.log('\n📊 Chunk Analysis:')
  console.log('==================')
  
  const chunks = fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(chunksDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        formattedSize: formatBytes(stats.size)
      }
    })
    .sort((a, b) => b.size - a.size)

  chunks.forEach((chunk, index) => {
    const indicator = chunk.size > 500000 ? '🔴' : chunk.size > 250000 ? '🟡' : '🟢'
    console.log(`${indicator} ${chunk.name}: ${chunk.formattedSize}`)
    
    if (index < 5 && chunk.size > 250000) {
      console.log(`   ⚠️  Large chunk detected - consider code splitting`)
    }
  })
  
  const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
  console.log(`\n📦 Total chunk size: ${formatBytes(totalChunkSize)}`)
}

// Analyze CSS
const cssDir = path.join(staticDir, 'css')
if (fs.existsSync(cssDir)) {
  console.log('\n🎨 CSS Analysis:')
  console.log('================')
  
  const cssFiles = fs.readdirSync(cssDir)
    .filter(file => file.endsWith('.css'))
    .map(file => {
      const filePath = path.join(cssDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        formattedSize: formatBytes(stats.size)
      }
    })

  cssFiles.forEach(file => {
    const indicator = file.size > 100000 ? '🔴' : file.size > 50000 ? '🟡' : '🟢'
    console.log(`${indicator} ${file.name}: ${file.formattedSize}`)
  })
  
  const totalCSSSize = cssFiles.reduce((sum, file) => sum + file.size, 0)
  console.log(`\n🎨 Total CSS size: ${formatBytes(totalCSSSize)}`)
}

// Performance recommendations
console.log('\n💡 Performance Recommendations:')
console.log('================================')

const recommendations = [
  '✅ Use dynamic imports for heavy components',
  '✅ Implement lazy loading for non-critical features',
  '✅ Optimize images with next/image',
  '✅ Enable compression in production',
  '✅ Use tree shaking to eliminate dead code',
  '✅ Consider using a CDN for static assets',
  '✅ Implement service worker for caching',
  '✅ Monitor Core Web Vitals',
]

recommendations.forEach(rec => console.log(rec))

// Bundle size limits
console.log('\n📏 Bundle Size Guidelines:')
console.log('==========================')
console.log('🟢 Good: < 250KB per chunk')
console.log('🟡 Warning: 250KB - 500KB per chunk')
console.log('🔴 Critical: > 500KB per chunk')
console.log('\n💡 Target total bundle size: < 1MB for optimal performance')

// Check for common optimization opportunities
console.log('\n🔍 Optimization Opportunities:')
console.log('==============================')

// Check for large dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

const heavyDependencies = [
  'moment', 'lodash', 'rxjs', 'core-js', 'babel-polyfill'
]

heavyDependencies.forEach(dep => {
  if (dependencies[dep]) {
    console.log(`⚠️  Consider replacing ${dep} with lighter alternatives`)
  }
})

// Check for duplicate dependencies
console.log('\n🔄 Checking for potential duplicate dependencies...')
const duplicateChecks = [
  ['react', 'preact'],
  ['moment', 'date-fns', 'dayjs'],
  ['lodash', 'ramda'],
  ['axios', 'fetch']
]

duplicateChecks.forEach(([dep1, dep2]) => {
  if (dependencies[dep1] && dependencies[dep2]) {
    console.log(`⚠️  Potential duplicate: ${dep1} and ${dep2}`)
  }
})

console.log('\n✅ Bundle analysis complete!')
console.log('📊 Check the generated report in .next/analyze/ for detailed insights')
console.log('🚀 Run "npm run build" for production-optimized build')

// Generate summary report
const report = {
  timestamp: new Date().toISOString(),
  totalSize: formatBytes(getDirectorySize(staticDir)),
  recommendations: recommendations,
  status: 'completed'
}

fs.writeFileSync('.next/bundle-analysis.json', JSON.stringify(report, null, 2))
console.log('📄 Summary report saved to .next/bundle-analysis.json')
