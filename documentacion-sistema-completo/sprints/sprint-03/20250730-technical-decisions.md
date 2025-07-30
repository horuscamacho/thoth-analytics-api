# DECISIONES T�CNICAS - SPRINT 3: SCRAPER INTEGRATION

**Sprint:** sprint-03-scraper-integration  
**Fecha:** 30 de Julio 2025

---

## DECISI�N #1: Throttling Configurable con Switch de Activaci�n/Desactivaci�n

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de implementar rate limiting para proteger la API de spam del scraper, pero tambi�n facilitar testing sin restricciones.

**Problema:** El throttling es necesario para producci�n pero puede obstaculizar las pruebas de desarrollo y testing automatizado.

**Opciones consideradas:**

### **Opci�n A: Throttling siempre activo**
- **Pros:** Mayor seguridad, configuraci�n simple
- **Cons:** Dificulta testing, pruebas lentas, debugging complicado

### **Opci�n B: Throttling configurado por perfil (dev/prod)**
- **Pros:** Autom�tico por ambiente
- **Cons:** Requiere m�ltiples configuraciones, menos flexibilidad

### **Opci�n C: Switch expl�cito con variables de entorno **
- **Pros:** Control total, f�cil activar/desactivar, configuraci�n granular
- **Cons:** Requiere documentaci�n clara

**Decisi�n:** Opci�n C - Switch expl�cito con variables de entorno

**Implementaci�n:**
```typescript
// Variables de entorno para control total
const THROTTLING_ENABLED = process.env.THROTTLING_ENABLED !== 'false';
const TWEETS_LIMIT = parseInt(process.env.THROTTLING_TWEETS_LIMIT || '100');

// Guards condicionales
@UseGuards(THROTTLING_ENABLED ? ThrottlerGuard : class {})
```

**Justificaci�n:**
1. **Flexibilidad m�xima:** Se puede activar/desactivar sin cambiar c�digo
2. **Testing facilitado:** `THROTTLING_ENABLED=false` para tests
3. **Configuraci�n granular:** L�mites espec�ficos por endpoint
4. **Producci�n segura:** Por defecto habilitado (fail-safe)

**Consecuencias:**
-  Testing m�s r�pido y confiable
-  Debugging simplificado en desarrollo
-  Configuraci�n espec�fica por ambiente
- � Requiere documentar correctamente las variables

**Configuraci�n implementada:**
```bash
# Para desactivar completamente (testing)
THROTTLING_ENABLED=false

# Para configuraci�n personalizada
THROTTLING_ENABLED=true
THROTTLING_TWEETS_LIMIT=200
THROTTLING_NEWS_LIMIT=100
```

---

## DECISI�N #2: Detecci�n de Duplicados con ContentHash

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de prevenir duplicados de tweets y noticias del scraper.

**Problema:** El scraper puede enviar el mismo tweet m�ltiples veces por errores de red, reintentos, o procesamiento duplicado.

**Opciones consideradas:**

### **Opci�n A: Solo por tweetId**
- **Pros:** Simple, directo
- **Cons:** No detecta contenido id�ntico con IDs diferentes

### **Opci�n B: Solo por contenido**
- **Pros:** Detecta duplicados reales
- **Cons:** No maneja variaciones menores de contenido

### **Opci�n C: ContentHash combinado (tweetId + contentHash) **
- **Pros:** Detecta duplicados por ID y por contenido
- **Cons:** M�s complejidad en queries

**Decisi�n:** Opci�n C - ContentHash combinado

**Implementaci�n:**
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

**Justificaci�n:**
1. **Robustez:** Previene duplicados por ID y contenido
2. **Flexibilidad:** Maneja casos edge de Twitter API
3. **Performance:** Hash SHA-256 r�pido para comparaci�n
4. **Auditor�a:** Tracking de duplicados para estad�sticas

**Consecuencias:**
-  Detecci�n robusta de duplicados
-  Estad�sticas de duplicados bloqueados
-  Base de datos limpia
- � Query ligeramente m�s compleja

---

## DECISI�N #3: Transacciones para Consistencia de Datos

**Fecha:** 30/07/2025  
**Contexto:** Necesidad de garantizar consistencia entre creaci�n de tweets/news y jobs de IA.

**Problema:** Si falla la creaci�n del job de IA despu�s de crear el tweet, los datos quedan inconsistentes.

**Opciones consideradas:**

### **Opci�n A: Operaciones separadas**
- **Pros:** Simple, directo
- **Cons:** Riesgo de inconsistencia, tweets sin jobs de IA

### **Opci�n B: Transacciones de base de datos **
- **Pros:** Atomicidad garantizada, rollback autom�tico
- **Cons:** Ligeramente m�s complejo

### **Opci�n C: Patr�n Saga**
- **Pros:** M�s escalable para microservicios
- **Cons:** Complejidad excesiva para este caso

**Decisi�n:** Opci�n B - Transacciones de base de datos

**Implementaci�n:**
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const tweet = await tx.tweet.create({ data: {...} });
  const aiJob = await tx.aiProcessingQueue.create({ data: {...} });
  return { tweet, aiJob };
});
```

**Justificaci�n:**
1. **ACID compliance:** Garantiza consistencia de datos
2. **Simplicidad:** Prisma maneja la complejidad
3. **Robustez:** Rollback autom�tico en caso de error
4. **Performance:** Transacciones locales r�pidas

**Consecuencias:**
-  Datos siempre consistentes
-  No tweets hu�rfanos sin jobs de IA
-  Manejo autom�tico de errores
- � Ligeramente m�s lento que operaciones separadas

---

**Pr�ximas decisiones:** Rate limiting avanzado, batch processing, circuit breakers