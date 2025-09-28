# 🚀 **PROMPT FINAL PARA CURSOR - SISTEMA EVEREST JOVEM E DINÂMICO**

## 🎯 **CONFIGURAÇÃO INICIAL**
**Modelo:** Claude 3.5 Sonnet (padrão)
**Mode:** Composer (editar múltiplos arquivos)
**Context:** Incluir `/src/components/ui/` e `/src/components/dashboard/widgets/`

---

## 📋 **PROMPT COMPLETO:**

# 🎨 MISSÃO: Transformar Sistema Everest em Experiência Jovem Moderna

## CONTEXTO DO PROJETO:
- Sistema educacional para estudantes jovens (16-25 anos)
- Stack: React + TypeScript + Tailwind + Shadcn/UI
- Design system já implementado (laranja vibrante + dark mode)
- Localização: Brasil (português)
- Foco: Cards animados e interativos

## REGRAS OBRIGATÓRIAS - NÃO QUEBRAR:

### 🔒 CONSISTÊNCIA VISUAL:
- SEMPRE manter cores do design system atual
- NUNCA alterar: --primary (laranja), --secondary, --muted
- PRESERVAR todos os componentes Shadcn/UI existentes
- Manter hierarquia tipográfica (Poppins)

### 🎯 PADRÕES DE ANIMAÇÃO:
- Duration: SEMPRE 300ms ou 200ms
- Easing: cubic-bezier(0.42, 0, 0.58, 1) ou ease-out
- Hover scale: máximo 1.05, ideal 1.02
- Shadow: primary/20 opacity máxima
- Transform: usar transform3d para GPU acceleration

### ♿ ACESSIBILIDADE:
- Respeitar prefers-reduced-motion
- Manter contraste de cores
- Focus states visíveis
- Semantic HTML

## COMPONENTES TARGET PARA ANIMAÇÃO:

### 1. CARDS BASE (/src/components/ui/card.tsx):
- Hover effects suaves
- Loading shimmer states
- Entrada com fade-in-up
- Subtle gradient borders

### 2. WIDGETS DASHBOARD (/src/components/dashboard/widgets/):
- AdminStatsWidget.tsx
- TeacherStatsWidget.tsx
- WelcomeWidget.tsx (se existir)
- CoursesWidget.tsx (se existir)
- ProgressWidget.tsx (se existir)
- EventsWidget.tsx (se existir)

## EFEITOS ESPECÍFICOS PARA IMPLEMENTAR:

### 🎪 HOVER EFFECTS (todos os cards):
```css
hover:scale-[1.02]
hover:shadow-xl
hover:shadow-primary/10
transition-all duration-300 ease-out
group (para animações coordenadas)
```

### ✨ LOADING STATES:
- Skeleton com shimmer effect
- Fade-in progressivo
- Stagger animation (100ms delay entre elementos)

### 🎭 MICRO-INTERAÇÕES:
- Ripple effect em buttons importantes
- Icons com subtle float/bounce
- Text reveal animations
- Number counting animations (stats)

### 🌈 VISUAL ENHANCEMENTS:
- Glassmorphism sutil (backdrop-blur-sm)
- Gradient borders em hover
- Soft inner shadows
- Color-shifting gradients

## IMPLEMENTAÇÃO TÉCNICA:

### CSS CUSTOM PROPERTIES (adicionar ao main.css):
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
}
```

### TAILWIND CLASSES PERMITIDAS:
- animate-* (customizar no tailwind.config)
- transform, translate, scale
- backdrop-blur, backdrop-saturate
- shadow-*, drop-shadow-*
- transition-*, duration-*, ease-*

### TYPESCRIPT:
- Manter todas as interfaces existentes
- Adicionar props opcionais para animações
- Usar React.memo onde apropriado

## ESTRUTURA DE ARQUIVOS:

### CRIAR/ATUALIZAR:
1. `/src/components/ui/animated-card.tsx` (wrapper do card base)
2. `/src/styles/animations.css` (keyframes personalizados)
3. `/src/hooks/useAnimations.ts` (hook para controlar animações)
4. Atualizar todos os widgets existentes

### DOCUMENTAÇÃO CRIAR:
1. `ANIMATION_GUIDE.md` - Padrões de animação
2. Comentários inline em cada componente
3. Storybook stories (se houver)

## REFERÊNCIAS DE ESTILO:
- Notion (hover cards elegantes)
- Linear.app (transições suaves)
- Stripe Dashboard (profissional + moderno)
- Discord UI (jovem mas polido)

## PERFORMANCE REQUIREMENTS:
- 60fps em animações
- Lazy loading de animations
- CSS will-change apenas quando necessário
- Cleanup de event listeners

## DELIVERABLES FINAIS:

### 1. COMPONENTES ATUALIZADOS:
- [ ] Card base com animações
- [ ] Todos os widgets com hover effects
- [ ] Loading states animados
- [ ] Button components aprimorados

### 2. SISTEMA DE ANIMAÇÕES:
- [ ] CSS keyframes organizados
- [ ] Hook personalizado para animações
- [ ] Utility classes no Tailwind
- [ ] Tokens de animação documentados

### 3. DOCUMENTAÇÃO:
- [ ] Guide de animações
- [ ] Exemplos de uso
- [ ] Do's and Don'ts
- [ ] Performance guidelines

## EXEMPLO DE CARD FINAL ESPERADO:
```tsx
<Card className="group hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 animate-fadeInUp">
  <CardHeader className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardTitle className="group-hover:text-primary transition-colors duration-200">
      {title}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="group-hover:translate-y-[-2px] transition-transform duration-200">
      {content}
    </div>
  </CardContent>
</Card>
```

## TESTING CHECKLIST:
- [ ] Animações funcionam em Chrome/Firefox/Safari
- [ ] Performance 60fps
- [ ] Mobile responsivo
- [ ] Dark mode compatível
- [ ] Reduced motion respeitado
- [ ] TypeScript sem erros

## MOOD/VIBE TARGET:
"Moderno, jovem, dinâmico mas profissional. Como se fosse um produto da Apple, mas para educação brasileira."

**FOCO: Impressionar jovens estudantes mantendo credibilidade profissional!**

---

## 🎯 **INSTRUÇÕES PARA USO NO CURSOR:**

1. **Cole esse prompt completo no chat**
2. **Ative Composer Mode**
3. **Selecione os arquivos dos widgets para contexto**
4. **Execute e revise cada mudança**
5. **Teste no preview em tempo real**

## 📊 **ARQUIVOS EXISTENTES NO PROJETO:**

### Componentes UI Base:
- `/src/components/ui/card.tsx` - Card base para animação
- `/src/components/ui/button.tsx` - Buttons para efeitos
- `/src/main.css` - CSS global para keyframes

### Widgets Dashboard:
- `/src/components/dashboard/widgets/AdminStatsWidget.tsx`
- `/src/components/dashboard/widgets/TeacherStatsWidget.tsx`

### Design System:
- `/tailwind.config.ts` - Configuração do Tailwind
- Cores: Primary laranja (--primary: 25 95% 53%)
- Font: Poppins
- Dark mode: Suportado

## 🚀 **RESULTADO ESPERADO:**
Sistema educacional moderno e dinâmico que impressiona jovens estudantes, mantendo profissionalismo e consistência visual em todos os componentes.

**Este prompt vai criar um sistema que os jovens vão AMAR! 🔥✨**