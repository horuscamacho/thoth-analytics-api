# INSTRUCCIONES DE SPRINT - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Propósito:** Guía completa para ejecutar sprints del proyecto

## WORKFLOW DE SPRINT

### **FASE 1: INICIO DE SPRINT**

#### **1.1 Crear rama de sprint:**
```bash
# Desde main
git checkout main
git pull origin main

# Crear nueva rama
git checkout -b sprint-{numero}-{nombre-descriptivo}

# Ejemplo:
git checkout -b sprint-01-infraestructura-base
```

#### **1.2 Crear documentación inicial:**
```bash
# Crear carpeta del sprint
mkdir -p documentacion-sistema-completo/sprints/sprint-{numero}

# Crear archivos base
touch documentacion-sistema-completo/sprints/sprint-{numero}/YYYYMMDD-sprint-planning-v1.md
touch documentacion-sistema-completo/sprints/sprint-{numero}/YYYYMMDD-daily-notes.md
touch documentacion-sistema-completo/sprints/sprint-{numero}/YYYYMMDD-technical-decisions.md
```

#### **1.3 Planning del sprint:**
Documentar en `YYYYMMDD-sprint-planning-v1.md`:
- **Objetivo del sprint**
- **User stories incluidas**
- **Definición de "Hecho"**
- **Riesgos identificados**
- **Dependencias externas**
- **Estimación de esfuerzo**

---

### **FASE 2: DESARROLLO DIARIO**

#### **2.1 Daily Stand-up (documentado):**
Actualizar `YYYYMMDD-daily-notes.md` con formato:
```markdown
## DÍA {X} - {FECHA}

### ✅ AYER COMPLETÉ:
- Tarea 1 completada
- Bug X resuelto

### 🔄 HOY TRABAJARÉ EN:
- Feature Y
- Refactoring Z

### 🚫 IMPEDIMENTOS:
- API de OpenAI con problemas
- Falta definición de X

### 📊 MÉTRICAS:
- Tiempo trabajado: X horas
- Commits: X
- Tests: X% cobertura
```

#### **2.2 Commits frecuentes:**
```bash
# Commits pequeños y descriptivos
git add .
git commit -m "feat(auth): implement JWT middleware

- Add token validation logic
- Include role-based authorization
- Add error handling for expired tokens"

# Push frecuente a la rama
git push origin sprint-01-infraestructura-base
```

#### **2.3 Documentar decisiones técnicas:**
En `YYYYMMDD-technical-decisions.md`:
```markdown
## DECISIÓN #{X}: {Título}
**Fecha:** DD/MM/YYYY
**Contexto:** Por qué necesitamos tomar esta decisión
**Opciones consideradas:**
1. Opción A - pros/cons
2. Opción B - pros/cons
**Decisión:** Opción elegida
**Justificación:** Por qué esta opción
**Consecuencias:** Qué implica esta decisión
```

---

### **FASE 3: FIN DE SPRINT**

#### **3.1 Documentar resultados:**
Crear `YYYYMMDD-sprint-retrospective-v1.md`:
```markdown
# RETROSPECTIVA SPRINT {NUMERO}

## 📊 MÉTRICAS DEL SPRINT
- **Duración:** X días
- **User stories completadas:** X/Y
- **Bugs encontrados:** X
- **Bugs resueltos:** X
- **Cobertura de tests:** X%
- **Performance:** X ms promedio

## ✅ LO QUE FUNCIONÓ BIEN
- Lista de éxitos

## ❌ LO QUE NO FUNCIONÓ
- Lista de problemas

## 🔧 MEJORAS PARA PRÓXIMO SPRINT
- Acciones específicas

## 📋 ENTREGABLES COMPLETADOS
- [ ] Feature 1
- [x] Feature 2
- [ ] Feature 3

## 🎯 DEFINICIÓN DE HECHO - VERIFICACIÓN
- [ ] Todos los tests pasan
- [ ] Código revisado
- [ ] Documentación actualizada
- [ ] Deploy funcionando
- [ ] Performance aceptable
```

#### **3.2 Merge a main:**
```bash
# Asegurar que todo está committeado
git add .
git commit -m "docs: add sprint retrospective and final documentation"

# Merge a main
git checkout main
git pull origin main
git merge sprint-01-infraestructura-base

# Resolver conflictos si los hay
# Luego push
git push origin main

# Opcional: crear tag
git tag -a v1.0.0-sprint-01 -m "Sprint 01 - Infraestructura Base completado"
git push origin v1.0.0-sprint-01
```

#### **3.3 Limpieza:**
```bash
# Eliminar rama local (opcional)
git branch -d sprint-01-infraestructura-base

# Eliminar rama remota (opcional)
git push origin --delete sprint-01-infraestructura-base
```

---

## DOCUMENTACIÓN REQUERIDA POR SPRINT

### **📋 DOCUMENTOS OBLIGATORIOS:**

#### **1. Sprint Planning (`YYYYMMDD-sprint-planning-v1.md`)**
```markdown
# SPRINT PLANNING - MÓDULO {X}

## 🎯 OBJETIVO DEL SPRINT
Descripción clara del objetivo principal

## 📋 USER STORIES INCLUIDAS
- [ ] US-XXX: Como usuario, quiero...
- [ ] US-YYY: Como usuario, quiero...

## ✅ DEFINICIÓN DE HECHO
- Criterio 1 específico y medible
- Criterio 2 específico y medible

## ⚠️ RIESGOS Y MITIGACIONES
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| API lenta | Alta | Medio | Cache + timeout |

## 🔗 DEPENDENCIAS
- Dependencia externa 1
- Dependencia interna 2

## 📊 ESTIMACIÓN
- Esfuerzo total: X puntos de historia
- Duración estimada: X días
- Recursos: X personas
```

#### **2. Daily Notes (`YYYYMMDD-daily-notes.md`)**
```markdown
# DAILY NOTES - SPRINT {X}

## SEMANA 1

### DÍA 1 - {FECHA}
### DÍA 2 - {FECHA}
### DÍA 3 - {FECHA}
### DÍA 4 - {FECHA}
### DÍA 5 - {FECHA}

## SEMANA 2
[Continuar formato...]
```

#### **3. Technical Decisions (`YYYYMMDD-technical-decisions.md`)**
```markdown
# DECISIONES TÉCNICAS - SPRINT {X}

## DECISIÓN #1: Título
## DECISIÓN #2: Título
[Formato completo como se mostró arriba]
```

#### **4. Sprint Retrospective (`YYYYMMDD-sprint-retrospective-v1.md`)**
[Formato completo como se mostró arriba]

### **📋 DOCUMENTOS OPCIONALES:**

#### **5. Architecture Changes (`YYYYMMDD-architecture-updates-v1.md`)**
Solo si hay cambios arquitectónicos significativos

#### **6. Performance Report (`YYYYMMDD-performance-analysis-v1.md`)**
Solo si hay métricas específicas de performance

#### **7. Security Analysis (`YYYYMMDD-security-review-v1.md`)**
Solo para sprints que tocan seguridad

---

## QUÉ DOCUMENTAR POR MÓDULO

### **MÓDULO 1: INFRAESTRUCTURA BASE**
**Documentar:**
- Setup de Docker y servicios
- Configuración de PostgreSQL
- Scripts de inicialización
- Configuración de CI/CD
- Benchmarks de performance base

**Reglas específicas de desarrollo:**
- ✅ **OBLIGATORIO:** Usar NestJS CLI para todos los componentes
  - `nest generate module nombre` para módulos
  - `nest generate service nombre` para servicios
  - `nest generate controller nombre` para controladores
  - `nest generate guard nombre` para guards
  - `nest generate middleware nombre` para middlewares
  - `nest generate decorator nombre` para decoradores
  - `nest generate interceptor nombre` para interceptors
- ✅ **OBLIGATORIO:** Usar ÚNICAMENTE Prisma ORM
  - NO usar TypeORM ni otros ORMs
  - Todas las entidades deben estar en `schema.prisma`
  - Usar Prisma Client para todas las operaciones de BD
  - Generar tipos automáticamente con `prisma generate`
- ✅ **OBLIGATORIO:** Claude NO ejecuta instalaciones de paquetes
  - Claude proporcionará el comando exacto de instalación
  - Horus ejecutará manualmente todas las instalaciones
  - Claude esperará confirmación antes de continuar
  - Esto evita timeouts y errores de instalación
- ✅ **OBLIGATORIO:** Mantener colección de API actualizada
  - Cada endpoint nuevo/modificado debe agregarse a la colección
  - Usar Insomnia como cliente API principal
  - Mantener scripts de autenticación y variables de entorno
  - Documentar ejemplos de request/response
  - Colección debe estar en `/api-collection/`
- ✅ Mantener estructura de carpetas por módulo
- ✅ Seguir convenciones de nomenclatura establecidas

### **MÓDULO 2: AUTH & MULTI-TENANCY** ✅ **85% COMPLETADO**
**✅ IMPLEMENTADO (30 JUL 2025):**
- ✅ Sistema de autenticación JWT completo (login/logout/refresh)
- ✅ RBAC con roles: DIRECTOR_COMUNICACION, LIDER, DIRECTOR_AREA, ASISTENTE
- ✅ Multi-tenancy con aislamiento completo de datos por tenant
- ✅ CRUD completo de usuarios: crear, suspender, reactivar, eliminar
- ✅ CRUD completo de tenants: gestión de entidades gubernamentales
- ✅ Seguridad: bcrypt, contraseñas temporales, guards, middlewares
- ✅ Validaciones y DTOs con class-validator
- ✅ Tests unitarios e integración
- ✅ Endpoints funcionales: /auth/*, /users/*, /tenants/*

**✅ COMPLETADO - FASE 2 (30 JUL 2025):**
- ✅ **Sistema de Auditoría Avanzado (US-D005)**:
  - ✅ AuditLogs model en Prisma con checksum y firma digital
  - ✅ AuditController con endpoints /audit/* (logs, export, stats, anomalies, integrity, dashboard)
  - ✅ AuditService con lógica de negocio y detección de anomalías
  - ✅ Exportación multi-formato (CSV, JSON, PDF)
  - ✅ Dashboard de auditoría con métricas visuales
  - ✅ Sistema de logs inmutables para compliance
  - ✅ Consultas SQL optimizadas para PostgreSQL

**📋 ARCHIVOS CLAVE:**
- `src/auth/` - Sistema de autenticación completo
- `src/users/` - Gestión de usuarios con auditoría básica
- `src/tenants/` - Gestión de tenants multi-tenancy
- `src/database/` - Prisma service y configuración
- `prisma/schema.prisma` - Modelos de datos implementados

**🎯 CRITERIOS DE COMPLETITUD SPRINT 2:**
- ✅ US-D001: Dar de alta nuevos usuarios - COMPLETADO
- ✅ US-D002: Suspender usuarios temporalmente - COMPLETADO  
- ✅ US-D003: Eliminar usuarios permanentemente - COMPLETADO
- ✅ US-D005: Auditar accesos y actividades - COMPLETADO

### **MÓDULO 3: SCRAPER INTEGRATION** ✅ **COMPLETADO (30 JUL 2025)**
**✅ IMPLEMENTADO:**
- ✅ API endpoints: POST /scrapers/tweets, POST /scrapers/news, GET /scrapers/health, GET /scrapers/stats
- ✅ DTOs con validaciones completas (CreateTweetDto, CreateNewsDto, ScraperResponseDto)
- ✅ ScrapersService con lógica de negocio: detección de duplicados, transacciones, auditoría
- ✅ Rate limiting configurable con THROTTLING_ENABLED env var
- ✅ Healthcheck con métricas de sistema y base de datos
- ✅ Sistema de estadísticas en tiempo real
- ✅ Tests unitarios (ScrapersService, ScrapersController)
- ✅ Colección Postman actualizada con 6 endpoints

**📋 ARCHIVOS CLAVE:**
- `src/scrapers/` - Módulo completo de scraper integration
- `src/scrapers/dto/` - DTOs con validaciones class-validator
- `api-collection/thoth-analytics-api-postman-collection.json` - Colección actualizada

**🎯 FLUJO IMPLEMENTADO:**
1. Scraper Python envía tweets de medios seleccionados → POST /scrapers/tweets
2. Sistema extrae enlaces de noticias → POST /scrapers/news  
3. Contenido se guarda en BD con hash para evitar duplicados
4. Se crean jobs en `aiProcessingQueue` para procesamiento IA

### **MÓDULO 4: AI PROCESSING** ✅ **COMPLETADO (30 JUL 2025)**
**🎯 OBJETIVO SPRINT 4:**
Procesar contenido scrapeado (tweets + noticias) con análisis IA multi-capa para extraer insights profundos y detectar riesgos gubernamentales.

**🔄 FLUJO DEL SISTEMA:**
1. **Input**: Jobs pendientes en `aiProcessingQueue` de tweets/noticias scrapeadas
2. **Procesamiento**: 4 tipos de análisis IA especializados 
3. **Output**: Resultados almacenados en `aiAnalysis` con alertas automáticas

**🚀 ANÁLISIS IA ESPECIALIZADOS (4 tipos):**
1. **Text Analysis**: Resumen ejecutivo, categorización, keywords, complejidad
2. **Sentiment Analysis**: Sentimiento, emociones, urgencia, bias detection  
3. **Entity Recognition**: Personas políticas, organizaciones, ubicaciones, entidades gubernamentales
4. **Risk Assessment**: Score de riesgo, categorías, impacto en gobernanza, acciones recomendadas

**⚙️ CONFIGURACIÓN OPENAI OPTIMIZADA:**
```typescript
{
  model: 'gpt-4o-mini',        // Más económico y rápido
  temperature: 0.3,            // Balance precisión/creatividad  
  max_tokens: 2000,            // Suficiente para análisis detallado
  response_format: { type: 'json_object' }  // Estructura consistente
}
```

**🔧 COMPONENTES A IMPLEMENTAR:**
- **AiProcessingModule**: Módulo principal con service, controller, cliente OpenAI
- **AiAnalysisService**: 4 métodos de análisis especializado con prompts optimizados
- **AiProcessingController**: Endpoints para monitoreo y gestión de procesamiento
- **QueueProcessor**: Worker para procesar jobs de `aiProcessingQueue` por prioridades
- **Cost Tracking**: Monitoreo de gastos OpenAI por operación
- **Alert System**: Alertas automáticas por risk score y sentiment crítico

**🎯 USER STORIES SPRINT 4:**
- **US-AI001**: Como sistema, quiero analizar tweets y noticias scrapeadas para extraer insights
- **US-AI002**: Como sistema, quiero detectar riesgos en contenido monitoreado  
- **US-AI003**: Como sistema, quiero identificar entidades políticas relevantes
- **US-AI004**: Como administrador, quiero monitorear costos de procesamiento IA
- **US-AI005**: Como sistema, quiero generar alertas por contenido crítico

**📊 CRITERIOS DE COMPLETITUD:**
- [x] AiProcessingModule con service y controller implementados
- [x] 4 tipos de análisis IA funcionando con prompts especializados
- [x] Worker de queue procesando jobs automáticamente
- [x] Sistema de alertas por risk score > umbral
- [x] Tracking de costos OpenAI por operación
- [x] Tests unitarios con 80%+ cobertura
- [x] Endpoints funcionales para monitoreo

**✅ IMPLEMENTADO:**
- ✅ API endpoints: POST /ai-processing/analyze, GET /ai-processing/queue/worker/stats, POST /ai-processing/queue/worker/start|stop
- ✅ AiAnalysisService con 4 métodos especializados (Text, Sentiment, Entity, Risk) 
- ✅ QueueProcessorService worker automático con retry logic y batch processing
- ✅ PromptsService con prompts optimizados para contexto político mexicano
- ✅ Cost tracking real-time con OpenAI token usage ($0.00015/1K input, $0.0006/1K output)
- ✅ Alert system automático para contenido crítico (risk score >= 70)
- ✅ Tests unitarios con 85%+ cobertura (AiAnalysisService, QueueProcessor, PromptsService)
- ✅ Colección Postman actualizada con 6 endpoints de queue management

**📋 ARCHIVOS CLAVE:**
- `src/ai-processing/` - Módulo completo de AI processing
- `src/ai-processing/ai-analysis/` - Servicio principal de análisis IA
- `src/ai-processing/queue-processor/` - Worker de procesamiento automático
- `src/ai-processing/prompts/` - Prompts especializados para México
- `api-collection/thoth-analytics-api-postman-collection.json` - Colección actualizada

**🎯 FLUJO IMPLEMENTADO:**
1. Contenido ingresa vía scrapers → Jobs en aiProcessingQueue
2. QueueProcessor worker ejecuta análisis cada 30 segundos
3. AiAnalysisService procesa con 4 tipos de análisis especializados
4. Resultados guardados en aiAnalysis con alertas automáticas para alto riesgo

### **MÓDULO 5: DASHBOARD & VISUALIZATION**
**Documentar:**
- API endpoints del dashboard
- Optimizaciones de queries
- WebSocket implementation
- Filtros y búsquedas
- Performance benchmarks

### **MÓDULO 6: ALERT SYSTEM**
**Documentar:**
- Reglas de alertas configuradas
- Canales de notificación
- Agrupación de alertas
- Integration con Expo
- False positive rates

### **MÓDULO 7: NEWS EXTRACTOR**
**Documentar:**
- Selectores por medio configurado
- Success rates por fuente
- Error handling strategies
- Performance por extracción
- Maintenance procedures

### **MÓDULO 8: CLUSTERING & ADVANCED**
**Documentar:**
- Algoritmos de clustering usados
- Configuración de embeddings
- Métricas de precisión
- Campaign detection accuracy
- Performance analysis

---

## CRITERIOS DE CALIDAD

### **CODE QUALITY:**
- [ ] Cobertura de tests > 80%
- [ ] Linting sin errores
- [ ] Type safety (TypeScript strict)
- [ ] Documentación de funciones públicas
- [ ] No código duplicado significativo

### **PERFORMANCE:**
- [ ] API response time < 200ms p95
- [ ] Database queries optimizadas
- [ ] Memory leaks verificados
- [ ] Carga de trabajo simulada

### **SECURITY:**
- [ ] Input validation completa
- [ ] SQL injection prevented
- [ ] XSS protection
- [ ] Authentication/authorization tested
- [ ] Sensitive data encrypted

### **DOCUMENTATION:**
- [ ] README actualizado
- [ ] API docs generadas
- [ ] Deployment instructions
- [ ] Troubleshooting guide
- [ ] Change log actualizado

---

## HERRAMIENTAS DE APOYO

### **COMANDOS ÚTILES:**
```bash
# Crear estructura de sprint rápidamente
npm run create-sprint -- --number 01 --name infraestructura-base

# Generar reporte automático
npm run sprint-report -- --sprint 01

# Validar criterios de calidad
npm run quality-check

# Backup de documentación
npm run backup-docs
```

### **TEMPLATES:**
Todos los templates están en `/templates/sprint/` para uso rápido.

---

**Nota:** Estas instrucciones deben seguirse religiosamente para mantener la trazabilidad y calidad del proyecto.