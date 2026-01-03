# 🎨 Guia de Animações - Sistema Everest

Este guia documenta os padrões de animação e interação implementados no Sistema Everest, focando em uma experiência jovem e moderna para estudantes.

## 🎯 Padrões Principais

### Duração e Timing
- **Duração padrão**: 300ms ou 200ms
- **Easing**: cubic-bezier(0.42, 0, 0.58, 1) ou ease-out
- **GPU Acceleration**: Uso de transform3d para melhor performance

### Escalas e Transformações
- **Hover scale**: máximo 1.05, ideal 1.02
- **Shadow opacity**: máximo primary/20
- **Transitions**: Sempre suaves e naturais

## 🎪 Componentes Animados

### AnimatedCard
```tsx
<AnimatedCard loading={false} animationDelay={100}>
  <AnimatedCardHeader>
    <AnimatedCardTitle>Título do Card</AnimatedCardTitle>
  </AnimatedCardHeader>
  <AnimatedCardContent>
    Conteúdo do card
  </AnimatedCardContent>
</AnimatedCard>
```

#### Propriedades
- `loading`: Estado de carregamento com efeito shimmer
- `animationDelay`: Delay para entrada do card (ms)

#### Efeitos
- Entrada com fade-in-up
- Hover com scale suave
- Gradient border em hover
- Loading shimmer state

### Hooks de Animação

#### useAnimations
```tsx
const { ref, isVisible, animationStyles } = useAnimations({
  duration: 300,
  delay: 0,
  threshold: 0.1
});
```

#### useStaggeredAnimation
```tsx
const delays = useStaggeredAnimation(itemCount, 100);
```

#### useCountAnimation
```tsx
const { count, startAnimation } = useCountAnimation(endValue, duration);
```

#### useRipple
```tsx
const createRipple = useRipple();
```

## 🎭 Classes de Utilidade

### Animações Básicas
```css
.animate-fadeInUp
.animate-shimmer
.animate-float
.animate-ripple
```

### Timing e Delays
```css
.duration-300
.ease-apple
.animation-delay-200
.animation-delay-400
```

## ♿ Acessibilidade

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 🚀 Performance

### Boas Práticas
1. Usar `will-change` apenas quando necessário
2. Preferir `transform` e `opacity` para animações
3. Implementar lazy loading de animações
4. Limpar event listeners

### GPU Acceleration
```css
transform: translate3d(0, 0, 0);
```

## 📋 Do's and Don'ts

### Do's
✅ Usar animações para feedback visual  
✅ Manter animações suaves e naturais  
✅ Respeitar prefers-reduced-motion  
✅ Usar GPU acceleration  

### Don'ts
❌ Animações muito longas (>500ms)  
❌ Múltiplas animações simultâneas  
❌ Ignorar performance em mobile  
❌ Animações que distraem do conteúdo  

## 🎨 Exemplos de Uso

### Cards com Loading
```tsx
<AnimatedCard loading>
  <CardContent>
    Carregando...
  </CardContent>
</AnimatedCard>
```

### Lista com Stagger
```tsx
const delays = useStaggeredAnimation(items.length);
items.map((item, i) => (
  <AnimatedCard key={item.id} animationDelay={delays[i].delay}>
    {item.content}
  </AnimatedCard>
))
```

### Contador Animado
```tsx
const { count, startAnimation } = useCountAnimation(1000);
<div onMouseEnter={startAnimation}>{count}</div>
```

## 🔍 Testes

### Checklist
- [ ] Animações funcionam em todos os browsers
- [ ] Performance mantém 60fps
- [ ] Responsivo em mobile
- [ ] Compatível com dark mode
- [ ] Respeita reduced motion
- [ ] Sem erros TypeScript

## 🎯 Referências

- [Linear.app](https://linear.app) - Transições suaves
- [Notion](https://notion.so) - Cards elegantes
- [Discord](https://discord.com) - UI jovem e polida
- [Stripe Dashboard](https://dashboard.stripe.com) - Profissional e moderno
