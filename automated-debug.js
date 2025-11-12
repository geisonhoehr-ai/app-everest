// Script automatizado para login e análise completa de bugs
import puppeteer from 'puppeteer'

async function comprehensiveDebugAnalysis() {
  console.log('🚀 Iniciando análise automatizada completa...\n')

  const browser = await puppeteer.launch({
    headless: false, // Mostrar o navegador para debug visual
    devtools: true,  // Abrir DevTools automaticamente
    args: [
      '--remote-debugging-port=9222',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  })

  const page = await browser.newPage()

  // Configurar coleta de logs
  const consoleMessages = []
  const networkErrors = []
  const jsErrors = []

  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    consoleMessages.push({ type, text, timestamp: new Date() })

    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`)
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`)
    }
  })

  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date()
    })
    console.log(`🚨 JavaScript Error: ${error.message}`)
  })

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date()
    })
    console.log(`🌐 Network Error: ${request.url()} - ${request.failure()?.errorText}`)
  })

  try {
    console.log('📱 Navegando para a aplicação...')
    await page.goto('http://localhost:8083', { waitUntil: 'networkidle2' })

    console.log('🔑 Realizando login automatizado...')

    // Aguardar elementos de login aparecerem
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.waitForSelector('input[type="password"]', { timeout: 5000 })

    // Preencher formulário de login
    await page.type('input[type="email"]', 'aluno@teste.com')
    await page.type('input[type="password"]', '123456')

    // Clicar no botão de login
    await page.click('button[type="submit"]')

    console.log('⏳ Aguardando login e carregamento do dashboard...')

    // Aguardar redirecionamento e carregamento
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })

    console.log('📊 Analisando dashboard e widgets...')

    // Aguardar widgets carregarem
    await page.waitForTimeout(3000)

    // Verificar se há erros no dashboard
    const dashboardErrors = await page.evaluate(() => {
      const errors = []

      // Verificar widgets não carregados
      const missingWidgets = document.querySelectorAll('[data-widget-error]')
      missingWidgets.forEach(widget => {
        errors.push(`Widget não carregado: ${widget.textContent}`)
      })

      // Verificar elementos com classe de erro
      const errorElements = document.querySelectorAll('.error, .text-destructive, [class*="error"]')
      errorElements.forEach(el => {
        if (el.textContent.trim()) {
          errors.push(`Elemento com erro: ${el.textContent.trim()}`)
        }
      })

      return errors
    })

    console.log('🧪 Testando navegação entre páginas...')

    // Testar navegação (se houver links)
    const navigationLinks = await page.$$('nav a, [role="navigation"] a')

    for (let i = 0; i < Math.min(navigationLinks.length, 3); i++) {
      try {
        const link = navigationLinks[i]
        const href = await link.evaluate(el => el.href)
        console.log(`🔗 Testando link: ${href}`)

        await link.click()
        await page.waitForTimeout(2000)

        // Voltar para dashboard
        await page.goBack()
        await page.waitForTimeout(1000)
      } catch (error) {
        console.log(`❌ Erro na navegação: ${error.message}`)
      }
    }

    console.log('🔐 Testando logout...')

    // Procurar botão de logout
    const logoutButton = await page.$('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]')
    if (logoutButton) {
      await logoutButton.click()
      await page.waitForTimeout(2000)
    }

    // Relatório final
    console.log('\n📋 RELATÓRIO DE ANÁLISE COMPLETA:')
    console.log('=====================================')

    console.log(`\n🗨️  Console Messages: ${consoleMessages.length}`)
    consoleMessages.slice(-10).forEach(msg => {
      console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`)
    })

    console.log(`\n🚨 JavaScript Errors: ${jsErrors.length}`)
    jsErrors.forEach(error => {
      console.log(`   ❌ ${error.message}`)
    })

    console.log(`\n🌐 Network Errors: ${networkErrors.length}`)
    networkErrors.forEach(error => {
      console.log(`   🔴 ${error.url} - ${error.failure?.errorText}`)
    })

    console.log(`\n📊 Dashboard Errors: ${dashboardErrors.length}`)
    dashboardErrors.forEach(error => {
      console.log(`   ⚠️  ${error}`)
    })

    // Performance metrics
    const metrics = await page.metrics()
    console.log('\n⚡ Performance Metrics:')
    console.log(`   Layouts: ${metrics.LayoutCount}`)
    console.log(`   Recalc Styles: ${metrics.RecalcStyleCount}`)
    console.log(`   JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`)

    console.log('\n✅ Análise completa finalizada!')

    return {
      consoleMessages,
      jsErrors,
      networkErrors,
      dashboardErrors,
      metrics
    }

  } catch (error) {
    console.log(`🚨 Erro durante análise: ${error.message}`)
    throw error
  } finally {
    // Manter o navegador aberto para inspeção manual
    console.log('\n🔍 Navegador mantido aberto para inspeção manual...')
    console.log('Feche o navegador quando terminar a análise.')
  }
}

// Executar análise
comprehensiveDebugAnalysis().catch(console.error)