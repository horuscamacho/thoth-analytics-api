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

### **MÓDULO 2: AUTH & MULTI-TENANCY**
**Documentar:**
- Flujo de autenticación completo
- Estrategia de multi-tenancy
- Configuración de JWT
- Tests de seguridad
- Middleware y guards creados

### **MÓDULO 3: SCRAPER INTEGRATION**
**Documentar:**
- API endpoints creados
- Formato de datos esperado
- Validaciones implementadas
- Rate limiting configurado
- Healthcheck functionality

### **MÓDULO 4: AI PROCESSING**
**Documentar:**
- Integración con OpenAI
- Prompts utilizados y optimizaciones
- Costos por operación
- Manejo de errores
- Cache strategy

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