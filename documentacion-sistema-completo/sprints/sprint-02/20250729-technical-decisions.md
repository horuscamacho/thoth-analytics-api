# DECISIONES TÉCNICAS - SPRINT 02: AUTH & MULTI-TENANCY

**Sprint:** 02  
**Fecha inicio:** 29 de Julio 2025  
**Propósito:** Documentar decisiones técnicas tomadas durante el sprint de autenticación y multi-tenancy

---

## DECISIÓN #1: Estrategia de JWT Tokens
**Fecha:** 29/07/2025  
**Contexto:** Necesitamos definir la estrategia de tokens JWT para el sistema de autenticación

**Opciones consideradas:**
1. **Access tokens únicamente**
   - ✅ Pros: Simplicidad de implementación
   - ❌ Cons: Problemas de seguridad con tokens largos, no hay revocación
   - 💰 Costo: Bajo desarrollo
   - ⏱️ Tiempo: 1 día implementación

2. **Access + Refresh tokens**
   - ✅ Pros: Mayor seguridad, tokens access cortos, revocación posible
   - ❌ Cons: Complejidad adicional, más endpoints
   - 💰 Costo: Medio desarrollo
   - ⏱️ Tiempo: 2 días implementación

3. **Session-based con Redis**
   - ✅ Pros: Revocación inmediata, control granular
   - ❌ Cons: Stateful, dependencia de Redis, no distribuible fácilmente
   - 💰 Costo: Alto desarrollo
   - ⏱️ Tiempo: 3 días implementación

**Decisión:** Access + Refresh tokens  
**Justificación:** 
- Balance perfecto entre seguridad y usabilidad
- Access tokens cortos (15-30 min) minimizan riesgo de exposición
- Refresh tokens largos (7 días) pero revocables
- Standard industry practice para APIs REST
- Compatible con arquitectura stateless

**Consecuencias:** 
- Necesitamos implementar endpoint `/auth/refresh`
- Lógica adicional para manejo de refresh tokens
- Storage en Redis para refresh tokens invalidados
- Client-side debe manejar refresh automático

**Plan de reversión:** Si la complejidad es excesiva, simplificar a access tokens únicamente con expiración corta (1 hora)

---

## DECISIÓN #2: Estrategia de Multi-Tenancy
**Fecha:** 29/07/2025  
**Contexto:** Definir cómo implementar aislamiento completo de datos entre tenants

**Opciones consideradas:**
1. **Database per tenant**
   - ✅ Pros: Aislamiento perfecto, backup independiente
   - ❌ Cons: Complejidad operacional, múltiples conexiones
   - 💰 Costo: Alto infraestructura
   - ⏱️ Tiempo: 5 días implementación

2. **Schema per tenant**
   - ✅ Pros: Buen aislamiento, una sola database
   - ❌ Cons: Complejidad en queries, migrations complejas
   - 💰 Costo: Medio desarrollo
   - ⏱️ Tiempo: 4 días implementación

3. **Row-level security con tenant_id**
   - ✅ Pros: Simplicidad, un solo schema, queries normales
   - ❌ Cons: Riesgo de data leakage si hay bugs
   - 💰 Costo: Bajo desarrollo
   - ⏱️ Tiempo: 2 días implementación

**Decisión:** Row-level security con tenant_id + Middleware obligatorio  
**Justificación:** 
- Simplicidad operacional y de desarrollo
- Prisma tiene excelente soporte para filtering automático
- Middleware obligatorio elimina riesgo de leakage
- Escalable para el tamaño esperado del proyecto
- Facilita queries de analytics cross-tenant si necesario

**Consecuencias:** 
- Todos los modelos Prisma deben tener `tenantId`
- Middleware `TenantMiddleware` obligatorio en todas las rutas
- Header `X-Tenant-ID` requerido en todos los requests
- Tests exhaustivos de tenant isolation necesarios

**Plan de reversión:** Migrar a schema per tenant si encontramos issues de performance o seguridad

---

## DECISIÓN #3: Jerarquía de Roles y Permisos
**Fecha:** 29/07/2025  
**Contexto:** Implementar sistema de roles con 4 niveles: Director, Gobernador, Secretario, Subordinado

**Opciones consideradas:**
1. **Role-based simple (4 roles fijos)**
   - ✅ Pros: Simplicidad, fácil de entender
   - ❌ Cons: Inflexible para futuro, hard-coded permissions
   - 💰 Costo: Bajo desarrollo
   - ⏱️ Tiempo: 1 día implementación

2. **RBAC (Role-Based Access Control) completo**
   - ✅ Pros: Flexible, escalable, industry standard
   - ❌ Cons: Over-engineering para requirements actuales
   - 💰 Costo: Alto desarrollo
   - ⏱️ Tiempo: 4 días implementación

3. **Híbrido: 4 roles con permissions configurables**
   - ✅ Pros: Balance entre simplicidad y flexibilidad
   - ❌ Cons: Complejidad media
   - 💰 Costo: Medio desarrollo
   - ⏱️ Tiempo: 2 días implementación

**Decisión:** Role-based simple con hierarchy guards  
**Justificación:** 
- Requirements claros con solo 4 roles específicos
- Jerarquía clara: Director > Gobernador = Secretario > Subordinado
- Fácil de implementar y testear
- Suficiente para MVP, escalable después si necesario
- Guards simples pueden verificar hierarchy

**Consecuencias:** 
- Enum `UserRole` en Prisma schema
- Guards diferentes por nivel de acceso
- Decorators para marcar endpoints con roles requeridos
- Tests de authorization por cada rol

**Plan de reversión:** Implementar RBAC completo si los requirements se vuelven más complejos

---

## DECISIÓN #4: Password Security Strategy
**Fecha:** 29/07/2025  
**Contexto:** Definir cómo almacenar y validar passwords de forma segura

**Opciones consideradas:**
1. **bcrypt con salt rounds 10**
   - ✅ Pros: Standard, bien probado, salt automático
   - ❌ Cons: No el más moderno
   - 💰 Costo: Mínimo
   - ⏱️ Tiempo: 0.5 días

2. **bcrypt con salt rounds 12**
   - ✅ Pros: Más seguro, buena relación seguridad/performance
   - ❌ Cons: Slightly slower
   - 💰 Costo: Mínimo
   - ⏱️ Tiempo: 0.5 días

3. **argon2 (más moderno)**
   - ✅ Pros: Estado del arte en password hashing
   - ❌ Cons: Menos familiar, dependencia adicional
   - 💰 Costo: Bajo
   - ⏱️ Tiempo: 1 día

**Decisión:** bcrypt con salt rounds 12  
**Justificación:** 
- Standard industry proven
- Excelente balance seguridad/performance
- Biblioteca madura y well-maintained
- Compatible con todos los environments
- 12 rounds = ~250ms hash time (apropiado para auth)

**Consecuencias:** 
- Variable de entorno `BCRYPT_SALT_ROUNDS=12`
- Hash passwords en AuthService before storing
- Compare passwords durante login
- Performance impact mínimo en auth operations

**Plan de reversión:** Mantener bcrypt, reducir a 10 rounds si hay performance issues

---

## DECISIÓN #5: [Template para futuras decisiones]
**Fecha:** DD/MM/YYYY  
**Contexto:** [Por qué necesitamos tomar esta decisión]

**Opciones consideradas:**
1. **Opción A**
   - ✅ Pros: [Ventajas]
   - ❌ Cons: [Desventajas]
   - 💰 Costo: [Implicaciones económicas]
   - ⏱️ Tiempo: [Implicaciones temporales]

2. **Opción B**  
   - ✅ Pros: [Ventajas]
   - ❌ Cons: [Desventajas]
   - 💰 Costo: [Implicaciones económicas]
   - ⏱️ Tiempo: [Implicaciones temporales]

**Decisión:** [Opción elegida]  
**Justificación:** [Razonamiento detallado]

**Consecuencias:** 
- [Implicación a corto plazo]
- [Implicación a largo plazo]
- [Riesgos asociados]

**Plan de reversión:** [Cómo podríamos deshacer esta decisión si es necesario]

---

## ÍNDICE DE DECISIONES

| # | Fecha | Decisión | Impacto | Estado |
|---|--------|----------|---------|--------|
| 1 | 29/07 | JWT Access + Refresh tokens | Alto | ✅ Implementado |
| 2 | 29/07 | Multi-tenancy con tenant_id | Alto | ✅ Implementado |
| 3 | 29/07 | Role hierarchy simple | Medio | ✅ Implementado |
| 4 | 29/07 | bcrypt con 12 salt rounds | Bajo | ✅ Implementado |
| 5 | -- | Pendiente | -- | 🔄 Pendiente |

---

## TEMPLATE PARA NUEVAS DECISIONES

```markdown
## DECISIÓN #{NUMERO}: {Título descriptivo}
**Fecha:** DD/MM/YYYY  
**Participantes:** [Quién estuvo involucrado]
**Contexto:** [Situación que requiere la decisión]

**Opciones consideradas:**
1. **Opción A**
   - ✅ Pros: [Ventajas]
   - ❌ Cons: [Desventajas]
   - 💰 Costo: [Implicaciones económicas]
   - ⏱️ Tiempo: [Implicaciones temporales]

2. **Opción B**
   - ✅ Pros: [Ventajas]
   - ❌ Cons: [Desventajas]
   - 💰 Costo: [Implicaciones económicas]
   - ⏱️ Tiempo: [Implicaciones temporales]

**Decisión:** [Opción elegida]  
**Justificación:** [Razonamiento detallado]

**Consecuencias:** 
- [Implicación a corto plazo]
- [Implicación a largo plazo]
- [Riesgos asociados]

**Plan de reversión:** [Cómo podríamos deshacer esta decisión si es necesario]
```

---

**NOTA:** Todas las decisiones técnicas importantes deben documentarse usando este formato para mantener trazabilidad, especialmente las relacionadas con seguridad y arquitectura.