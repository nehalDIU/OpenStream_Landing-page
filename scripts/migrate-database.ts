/**
 * Database Migration Script
 * Run this script to add usage tracking columns to existing database
 * 
 * Usage: npx tsx scripts/migrate-database.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting database migration...')

  try {
    // Check if columns already exist
    console.log('🔍 Checking current database schema...')
    
    const { data: existingCodes, error: checkError } = await supabase
      .from('access_codes')
      .select('*')
      .limit(1)

    if (checkError) {
      throw new Error(`Failed to check database schema: ${checkError.message}`)
    }

    const hasAdvancedColumns = existingCodes && existingCodes.length > 0 && 
      existingCodes[0].hasOwnProperty('max_uses') && 
      existingCodes[0].hasOwnProperty('current_uses')

    if (hasAdvancedColumns) {
      console.log('✅ Advanced settings columns already exist!')
      console.log('📊 Current schema includes:')
      console.log('   - prefix (VARCHAR(4))')
      console.log('   - auto_expire_on_use (BOOLEAN)')
      console.log('   - max_uses (INTEGER)')
      console.log('   - current_uses (INTEGER)')
      return
    }

    console.log('📝 Adding advanced settings columns...')

    // Add the new columns using SQL
    const migrations = [
      // Add prefix column
      `ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS prefix VARCHAR(4);`,
      
      // Add auto_expire_on_use column
      `ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS auto_expire_on_use BOOLEAN DEFAULT TRUE;`,
      
      // Add max_uses column
      `ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL;`,
      
      // Add current_uses column
      `ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;`,
      
      // Update existing records
      `UPDATE access_codes SET auto_expire_on_use = TRUE WHERE auto_expire_on_use IS NULL;`,
      `UPDATE access_codes SET current_uses = 0 WHERE current_uses IS NULL;`,
      
      // Add indexes
      `CREATE INDEX IF NOT EXISTS idx_access_codes_prefix ON access_codes(prefix);`,
      `CREATE INDEX IF NOT EXISTS idx_access_codes_auto_expire ON access_codes(auto_expire_on_use);`,
      `CREATE INDEX IF NOT EXISTS idx_access_codes_max_uses ON access_codes(max_uses);`,
      `CREATE INDEX IF NOT EXISTS idx_access_codes_current_uses ON access_codes(current_uses);`,
    ]

    for (const migration of migrations) {
      console.log(`   Executing: ${migration.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: migration })
      
      if (error) {
        // Try alternative approach using direct SQL
        const { error: directError } = await supabase
          .from('access_codes')
          .select('*')
          .limit(0) // This will fail but might give us better error info
        
        console.warn(`   ⚠️ Migration step failed: ${error.message}`)
        console.log(`   📝 Please run this SQL manually in Supabase SQL Editor:`)
        console.log(`   ${migration}`)
      } else {
        console.log(`   ✅ Success`)
      }
    }

    // Verify the migration
    console.log('🔍 Verifying migration...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('access_codes')
      .select('*')
      .limit(1)

    if (verifyError) {
      throw new Error(`Failed to verify migration: ${verifyError.message}`)
    }

    const hasNewColumns = verifyData && verifyData.length > 0 && 
      verifyData[0].hasOwnProperty('max_uses') && 
      verifyData[0].hasOwnProperty('current_uses')

    if (hasNewColumns) {
      console.log('✅ Migration completed successfully!')
      console.log('🎉 Advanced settings are now available:')
      console.log('   - Custom prefixes for access codes')
      console.log('   - Auto-expire on use control')
      console.log('   - Usage limits (max_uses)')
      console.log('   - Usage tracking (current_uses)')
    } else {
      console.log('⚠️ Migration may not have completed fully.')
      console.log('📝 Please run the SQL commands manually in Supabase SQL Editor.')
      console.log('📄 See: database/migration-add-usage-tracking.sql')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n📝 Manual Migration Instructions:')
    console.log('1. Open Supabase Dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Run the migration script: database/migration-add-usage-tracking.sql')
    process.exit(1)
  }
}

// Helper function to create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
  if (error) {
    console.log('📝 Could not create exec_sql function. Manual migration required.')
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
}

export { runMigration }
