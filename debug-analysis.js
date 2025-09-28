// Análise de bugs sem dependências externas
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzU5NTIsImV4cCI6MjA2ODUxMTk1Mn0.cT7fe1wjee9HfZw_IVD7K_exMqu-LtUxiClCD-sDLyU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function analyzeSystemHealth() {
  console.log('🔍 ANÁLISE COMPLETA DO SISTEMA')
  console.log('=====================================\n')

  const issues = []
  const warnings = []
  const recommendations = []

  // 1. Testar conexão com Supabase
  console.log('1️⃣  Testando conexão com Supabase...')
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      issues.push(`❌ Erro na conexão Supabase: ${error.message}`)
    } else {
      console.log(`   ✅ Conexão OK - ${count} usuários na base`)
    }
  } catch (error) {
    issues.push(`🚨 Falha crítica na conexão: ${error.message}`)
  }

  // 2. Verificar integridade dos dados
  console.log('\n2️⃣  Verificando integridade dos dados...')

  try {
    // Verificar usuários órfãos
    const { data: users } = await supabase.from('users').select('id, email')
    console.log(`   📊 Total de usuários: ${users?.length || 0}`)

    // Verificar IDs duplicados
    if (users) {
      const emailCounts = {}
      users.forEach(user => {
        emailCounts[user.email] = (emailCounts[user.email] || 0) + 1
      })

      const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1)
      if (duplicates.length > 0) {
        issues.push(`⚠️  Emails duplicados encontrados: ${duplicates.map(([email]) => email).join(', ')}`)
      }
    }

    // Verificar estrutura de tabelas relacionadas
    const { data: students } = await supabase.from('students').select('id').limit(1)
    const { data: teachers } = await supabase.from('teachers').select('id').limit(1)

    console.log(`   👨‍🎓 Tabela students: ${students ? 'OK' : 'Erro'}`)
    console.log(`   👨‍🏫 Tabela teachers: ${teachers ? 'OK' : 'Erro'}`)

  } catch (error) {
    issues.push(`❌ Erro na verificação de dados: ${error.message}`)
  }

  // 3. Testar autenticação
  console.log('\n3️⃣  Testando fluxo de autenticação...')

  const testUsers = [
    { email: 'aluno@teste.com', password: '123456', role: 'student' },
    { email: 'professor@teste.com', password: '123456', role: 'teacher' },
    { email: 'admin@teste.com', password: '123456', role: 'administrator' }
  ]

  for (const user of testUsers) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (authError) {
        issues.push(`❌ Login falhou para ${user.email}: ${authError.message}`)
      } else {
        console.log(`   ✅ Login OK: ${user.email}`)

        // Verificar se perfil existe
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile) {
          issues.push(`❌ Perfil não encontrado para ${user.email}`)
        } else {
          console.log(`   ✅ Perfil OK: ${profile.first_name} ${profile.last_name}`)
        }

        await supabase.auth.signOut()
      }
    } catch (error) {
      issues.push(`🚨 Erro crítico no teste de ${user.email}: ${error.message}`)
    }
  }

  // 4. Verificar servidor web
  console.log('\n4️⃣  Testando servidor web...')

  try {
    const response = await fetch('http://localhost:8083')
    if (response.ok) {
      console.log(`   ✅ Servidor OK - Status: ${response.status}`)
    } else {
      issues.push(`❌ Servidor com problema - Status: ${response.status}`)
    }
  } catch (error) {
    issues.push(`🚨 Servidor não responsivo: ${error.message}`)
  }

  // 5. Análise de segurança básica
  console.log('\n5️⃣  Verificações de segurança...')

  // Verificar se variáveis sensíveis estão expostas
  const sensitiveData = [
    'SUPABASE_SERVICE_KEY',
    'DATABASE_PASSWORD',
    'JWT_SECRET'
  ]

  sensitiveData.forEach(key => {
    if (process.env[key]) {
      warnings.push(`⚠️  Variável sensível detectada: ${key}`)
    }
  })

  // 6. Recomendações de melhorias
  console.log('\n6️⃣  Gerando recomendações...')

  recommendations.push('🔧 Reabilitar RLS na tabela users após testes')
  recommendations.push('🔧 Implementar logging estruturado')
  recommendations.push('🔧 Adicionar monitoramento de performance')
  recommendations.push('🔧 Configurar backup automático')
  recommendations.push('🔧 Implementar rate limiting')

  // 7. Relatório final
  console.log('\n📋 RELATÓRIO FINAL')
  console.log('==================')

  console.log(`\n🚨 Problemas Críticos: ${issues.length}`)
  issues.forEach(issue => console.log(`   ${issue}`))

  console.log(`\n⚠️  Avisos: ${warnings.length}`)
  warnings.forEach(warning => console.log(`   ${warning}`))

  console.log(`\n💡 Recomendações: ${recommendations.length}`)
  recommendations.forEach(rec => console.log(`   ${rec}`))

  console.log('\n🎯 STATUS GERAL:')
  if (issues.length === 0) {
    console.log('   ✅ SISTEMA SAUDÁVEL - Pronto para produção!')
  } else if (issues.length < 3) {
    console.log('   ⚠️  ATENÇÃO NECESSÁRIA - Alguns problemas encontrados')
  } else {
    console.log('   🚨 INTERVENÇÃO URGENTE - Múltiplos problemas críticos')
  }

  console.log('\n🔧 PRÓXIMOS PASSOS:')
  console.log('1. Corrigir problemas críticos identificados')
  console.log('2. Implementar recomendações de segurança')
  console.log('3. Configurar monitoramento contínuo')
  console.log('4. Realizar testes de carga')

  return { issues, warnings, recommendations }
}

// Executar análise
analyzeSystemHealth()
  .then(result => {
    console.log('\n✅ Análise concluída!')
  })
  .catch(error => {
    console.log(`\n🚨 Erro na análise: ${error.message}`)
  })