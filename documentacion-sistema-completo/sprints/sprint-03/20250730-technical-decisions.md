# DECISIONES TÉCNICAS - SPRINT 3: SCRAPER INTEGRATION

**Sprint:** sprint-03-scraper-integration  
**Fecha:** 30 de Julio 2025

---

## DECISIÓN #1: Throttling Configurable con Switch de Activación/Desactivación

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de implementar rate limiting para proteger la API de spam del scraper, pero también facilitar testing sin restricciones.

**Problema:** El throttling es necesario para producción pero puede obstaculizar las pruebas de desarrollo y testing automatizado.

**Opciones consideradas:**

### **Opción A: Throttling siempre activo**
- **Pros:** Mayor seguridad, configuración simple
- **Cons:** Dificulta testing, pruebas lentas, debugging complicado

### **Opción B: Throttling configurado por perfil (dev/prod)**
- **Pros:** Automático por ambiente
- **Cons:** Requiere múltiples configuraciones, menos flexibilidad

### **Opción C: Switch explícito con variables de entorno **
- **Pros:** Control total, fácil activar/desactivar, configuración granular
- **Cons:** Requiere documentación clara

**Decisión:** Opción C - Switch explícito con variables de entorno

**Implementación:**
```typescript
// Variables de entorno para control total
const THROTTLING_ENABLED = process.env.THROTTLING_ENABLED !== 'false';
const TWEETS_LIMIT = parseInt(process.env.THROTTLING_TWEETS_LIMIT || '100');

// Guards condicionales
@UseGuards(THROTTLING_ENABLED ? ThrottlerGuard : class {})
```

**Justificación:**
1. **Flexibilidad máxima:** Se puede activar/desactivar sin cambiar código
2. **Testing facilitado:** `THROTTLING_ENABLED=false` para tests
3. **Configuración granular:** Límites específicos por endpoint
4. **Producción segura:** Por defecto habilitado (fail-safe)

**Consecuencias:**
-  Testing más rápido y confiable
-  Debugging simplificado en desarrollo
-  Configuración específica por ambiente
-   Requiere documentar correctamente las variables

**Configuración implementada:**
```bash
# Para desactivar completamente (testing)
THROTTLING_ENABLED=false

# Para configuración personalizada
THROTTLING_ENABLED=true
THROTTLING_TWEETS_LIMIT=200
THROTTLING_NEWS_LIMIT=100
```

---

## DECISIÓN #2: Detección de Duplicados con ContentHash

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de prevenir duplicados de tweets y noticias del scraper.

**Problema:** El scraper puede enviar el mismo tweet múltiples veces por errores de red, reintentos, o procesamiento duplicado.

**Opciones consideradas:**

### **Opción A: Solo por tweetId**
- **Pros:** Simple, directo
- **Cons:** No detecta contenido idéntico con IDs diferentes

### **Opción B: Solo por contenido**
- **Pros:** Detecta duplicados reales
- **Cons:** No maneja variaciones menores de contenido

### **Opción C: ContentHash combinado (tweetId + contentHash) **
- **Pros:** Detecta duplicados por ID y por contenido
- **Cons:** Más complejidad en queries

**Decisión:** Opción C - ContentHash combinado

**Implementación:**
```typescript
const contentHash = this.generateContentHash(
  createTweetDto.content,
  createTweetDto.authorHandle,
  createTweetDto.publishedAt
);

const existingTweet = await this.prisma.tweet.findFirst({
  where: {
    OR: [
      { tweetId: createTweetDto.tweetId },
      { contentHash: contentHash }
    ]
  }
});
```

**Justificación:**
1. **Robustez:** Previene duplicados por ID y contenido
2. **Flexibilidad:** Maneja casos edge de Twitter API
3. **Performance:** Hash SHA-256 rápido para comparación
4. **Auditoría:** Tracking de duplicados para estadísticas

**Consecuencias:**
-  Detección robusta de duplicados
-  Estadísticas de duplicados bloqueados
-  Base de datos limpia
-   Query ligeramente más compleja

---

## DECISIÓN #3: Transacciones para Consistencia de Datos

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de garantizar consistencia entre creación de tweets/news y jobs de IA.

**Problema:** Si falla la creación del job de IA después de crear el tweet, los datos quedan inconsistentes.

**Opciones consideradas:**

### **Opción A: Operaciones separadas**
- **Pros:** Simple, directo
- **Cons:** Riesgo de inconsistencia, tweets sin jobs de IA

### **Opción B: Transacciones de base de datos **
- **Pros:** Atomicidad garantizada, rollback automático
- **Cons:** Ligeramente más complejo

### **Opción C: Patrón Saga**
- **Pros:** Más escalable para microservicios
- **Cons:** Complejidad excesiva para este caso

**Decisión:** Opción B - Transacciones de base de datos

**Implementación:**
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const tweet = await tx.tweet.create({ data: {...} });
  const aiJob = await tx.aiProcessingQueue.create({ data: {...} });
  return { tweet, aiJob };
});
```

**Justificación:**
1. **ACID compliance:** Garantiza consistencia de datos
2. **Simplicidad:** Prisma maneja la complejidad
3. **Robustez:** Rollback automático en caso de error
4. **Performance:** Transacciones locales rápidas

**Consecuencias:**
-  Datos siempre consistentes
-  No tweets huérfanos sin jobs de IA
-  Manejo automático de errores
-   Ligeramente más lento que operaciones separadas

---

**Próximas decisiones:** Rate limiting avanzado, batch processing, circuit breakers