#!/usr/bin/env node

// Development setup script for OpenStream Admin Dashboard
// Checks dependencies, environment, and starts development server

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 OpenStream Admin Dashboard - Development Setup')
console.log('================================================\n')

// Check Node.js version
const nodeVersion = process.version
const requiredNodeVersion = '18.0.0'
console.log(`📦 Node.js version: ${nodeVersion}`)

if (nodeVersion < `v${requiredNodeVersion}`) {
  console.error(`❌ Node.js ${requiredNodeVersion} or higher is required`)
  process.exit(1)
}

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Are you in the correct directory?')
  process.exit(1)
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...')
  try {
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ Dependencies installed successfully')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message)
    process.exit(1)
  }
}

// Check environment file
if (!fs.existsSync('.env.local')) {
  console.log('⚠️  .env.local not found')
  console.log('📝 Creating example environment file...')
  
  const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Authentication
ADMIN_TOKEN=your_admin_token

# Optional: Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
`
  
  fs.writeFileSync('.env.example', envExample)
  console.log('✅ Created .env.example - Please copy to .env.local and configure')
}

// Check TypeScript configuration
if (!fs.existsSync('tsconfig.json')) {
  console.log('📝 TypeScript configuration not found')
  console.log('⚠️  This project requires TypeScript configuration')
}

// Check Next.js configuration
if (!fs.existsSync('next.config.mjs')) {
  console.log('⚠️  next.config.mjs not found')
}

// Performance check
console.log('\n🔍 Performance Check:')
console.log('====================')

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

// Check for heavy dependencies
const heavyDeps = [
  'moment',
  'lodash',
  'rxjs',
  'core-js'
]

let hasHeavyDeps = false
heavyDeps.forEach(dep => {
  if (dependencies[dep]) {
    console.log(`⚠️  Heavy dependency detected: ${dep}`)
    hasHeavyDeps = true
  }
})

if (!hasHeavyDeps) {
  console.log('✅ No heavy dependencies detected')
}

// Check bundle size (if build exists)
const buildDir = '.next'
if (fs.existsSync(buildDir)) {
  console.log('📊 Previous build found - checking bundle size...')
  
  try {
    const staticDir = path.join(buildDir, 'static')
    if (fs.existsSync(staticDir)) {
      const getDirectorySize = (dirPath) => {
        let totalSize = 0
        const files = fs.readdirSync(dirPath, { withFileTypes: true })
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file.name)
          if (file.isDirectory()) {
            totalSize += getDirectorySize(filePath)
          } else {
            totalSize += fs.statSync(filePath).size
          }
        })
        
        return totalSize
      }
      
      const totalSize = getDirectorySize(staticDir)
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
      
      console.log(`📦 Bundle size: ${sizeInMB} MB`)
      
      if (totalSize > 5 * 1024 * 1024) { // 5MB
        console.log('⚠️  Bundle size is large - consider optimization')
      } else {
        console.log('✅ Bundle size looks good')
      }
    }
  } catch (error) {
    console.log('⚠️  Could not analyze bundle size')
  }
}

// Development tips
console.log('\n💡 Development Tips:')
console.log('====================')
console.log('🚀 npm run dev          - Start development server')
console.log('🔍 npm run analyze      - Analyze bundle size')
console.log('⚡ npm run dev:turbo     - Start with Turbo mode')
console.log('🧹 npm run lint:fix     - Fix linting issues')
console.log('📊 npm run perf         - Performance analysis')
console.log('🔧 npm run type-check   - TypeScript type checking')

// Start development server
console.log('\n🚀 Starting development server...')
console.log('================================')

try {
  // Check if port 3000 is available
  const { spawn } = require('child_process')
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  })
  
  devProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message)
    process.exit(1)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down development server...')
    devProcess.kill('SIGINT')
    process.exit(0)
  })
  
} catch (error) {
  console.error('❌ Failed to start development server:', error.message)
  console.log('\n🔧 Try running manually:')
  console.log('npm run dev')
  process.exit(1)
}
