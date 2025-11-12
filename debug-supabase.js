// Debug script to test Supabase connectivity and auth issues
import { createClient } from '@supabase/supabase-js'

console.log('🔍 Testing Supabase connectivity...')

const SUPABASE_URL = 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzU5NTIsImV4cCI6MjA2ODUxMTk1Mn0.cT7fe1wjee9HfZw_IVD7K_exMqu-LtUxiClCD-sDLyU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connectivity...')

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }

    console.log('✅ Basic connection OK')
    return true

  } catch (err) {
    console.error('❌ Network error:', err.message)
    return false
  }
}

async function testAuth() {
  try {
    console.log('2️⃣ Testing current session...')

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Session error:', error.message)
      return null
    }

    if (!session) {
      console.log('ℹ️ No active session found')
      return null
    }

    console.log('✅ Active session found for:', session.user.email)
    return session

  } catch (err) {
    console.error('❌ Auth error:', err.message)
    return null
  }
}

async function testUserProfile(userId) {
  try {
    console.log('3️⃣ Testing user profile fetch...')

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        students(*),
        teachers(*)
      `)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('❌ Profile fetch failed:', error.message)
      console.error('Error details:', error)
      return null
    }

    if (!data) {
      console.log('⚠️ User profile not found in database')
      console.log('User exists in auth but not in users table')
      return null
    }

    console.log('✅ Profile found:', {
      id: data.id,
      email: data.email,
      role: data.role,
      hasStudent: !!data.students,
      hasTeacher: !!data.teachers
    })

    return data

  } catch (err) {
    console.error('❌ Profile error:', err.message)
    return null
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Supabase diagnostics...\n')

  // Test 1: Basic connectivity
  const isConnected = await testConnection()
  console.log('')

  if (!isConnected) {
    console.log('🛑 Cannot proceed - no connection to Supabase')
    return
  }

  // Test 2: Authentication state
  const session = await testAuth()
  console.log('')

  if (!session) {
    console.log('🛑 Cannot test profile - no active session')
    console.log('💡 Solution: Login first at http://localhost:8087/login')
    return
  }

  // Test 3: User profile
  const profile = await testUserProfile(session.user.id)
  console.log('')

  if (!profile) {
    console.log('🔴 PROBLEM FOUND: User authenticated but profile missing!')
    console.log('💡 This explains the infinite loading loop')
    console.log('💡 Solution: Create user profile in database or check RLS policies')
  } else {
    console.log('✅ Everything looks good - profile exists')
    console.log('💡 Issue might be elsewhere (network timing, component state, etc.)')
  }

  console.log('\n🏁 Diagnostics complete')
}

runDiagnostics().catch(console.error)