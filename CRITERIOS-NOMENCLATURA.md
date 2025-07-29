# CRITERIOS DE NOMENCLATURA - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Propósito:** Estandarizar nombres en todo el proyecto

## NOMENCLATURA DE RAMAS GIT

### **FORMATO:**
```
sprint-{numero}-{nombre-descriptivo}
```

### **EJEMPLOS:**
- `sprint-01-infraestructura-base`
- `sprint-02-auth-multitenancy` 
- `sprint-03-scraper-integration`
- `sprint-04-ai-processing`
- `sprint-05-dashboard-visualization`
- `sprint-06-alert-system`
- `sprint-07-news-extractor`
- `sprint-08-clustering-advanced`

### **REGLAS:**
- Solo minúsculas
- Guiones para separar palabras (kebab-case)
- Máximo 40 caracteres
- Descriptivo del módulo principal

---

## NOMENCLATURA DE ARCHIVOS

### **DOCUMENTACIÓN:**
```
YYYYMMDD-{tipo}-{descripcion}-v{version}.md
```

**Ejemplos:**
- `20250729-sprint-planning-m01-v1.md`
- `20250805-retrospectiva-m01-v1.md`
- `20250812-architecture-decision-auth-v2.md`

### **CÓDIGO:**
```
{modulo}.{funcionalidad}.{extension}
```

**Ejemplos:**
- `auth.service.ts`
- `tenant.middleware.ts`
- `tweet.entity.ts`
- `ai-analysis.worker.ts`

### **TESTS:**
```
{archivo-principal}.spec.ts
{archivo-principal}.e2e-spec.ts
```

### **MIGRATIONS:**
```
{timestamp}_{descripcion_snake_case}
```

**Ejemplo:**
- `20250729_create_users_table`
- `20250805_add_tenant_isolation`

---

## NOMENCLATURA DE VARIABLES Y FUNCIONES

### **TYPESCRIPT/JAVASCRIPT:**
- **Variables:** `camelCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Interfaces:** `PascalCase`
- **Clases:** `PascalCase`
- **Métodos:** `camelCase`

```typescript
// ✅ Correcto
const userName = 'horus';
const API_BASE_URL = 'https://api.thoth.mx';

interface UserProfile {
  id: string;
  tenantId: string;
}

class AuthService {
  async validateToken(token: string): Promise<boolean> {
    // implementation
  }
}
```

### **PYTHON:**
- **Variables:** `snake_case`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Clases:** `PascalCase`
- **Funciones:** `snake_case`

```python
# ✅ Correcto
user_name = 'horus'
API_BASE_URL = 'https://api.thoth.mx'

class ScraperService:
    def extract_tweet_data(self, tweet_id: str) -> dict:
        # implementation
        pass
```

### **SQL:**
- **Tablas:** `snake_case` (plural)
- **Columnas:** `snake_case`
- **Índices:** `idx_{tabla}_{columna}`
- **Constraints:** `{tipo}_{tabla}_{columna}`

```sql
-- ✅ Correcto
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
```

---

## ESTRUCTURA DE CARPETAS

```
thoth-analytics-api/
├── README.md
├── CRITERIOS-NOMENCLATURA.md
├── INSTRUCCIONES-SPRINT.md
├── docker-compose.yml
├── package.json
│
├── documentacion-sistema-completo/
│   ├── arquitectura/
│   ├── decisiones-tecnicas/
│   └── sprints/
│       ├── sprint-01/
│       ├── sprint-02/
│       └── ...
│
├── documentacion-base-de-datos/
│   ├── modelos/
│   ├── migrations/
│   └── queries/
│
├── userstories/
│   ├── epics/
│   ├── criterios-aceptacion/
│   └── priorizacion/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tweets/
│   │   ├── news/
│   │   ├── ai-analysis/
│   │   ├── alerts/
│   │   └── common/
│   ├── test/
│   └── docs/
│
├── scraper-service/
│   ├── src/
│   ├── tests/
│   └── docs/
│
├── extractor-service/
│   ├── src/
│   ├── tests/
│   └── docs/
│
└── deployment/
    ├── docker/
    ├── aws/
    └── monitoring/
```

---

## NOMENCLATURA DE COMMITS

### **FORMATO:**
```
{tipo}({scope}): {descripcion}

{cuerpo opcional}

{footer opcional}
```

### **TIPOS:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Solo documentación
- `style`: Formato, espacios, etc
- `refactor`: Refactorización sin cambio funcional
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

### **EJEMPLOS:**
```bash
feat(auth): add JWT token validation middleware

- Implement token verification
- Add refresh token logic
- Include role-based authorization

Closes #123
```

```bash
fix(scraper): handle timeout errors gracefully

- Add retry logic for failed requests
- Improve error logging
- Set reasonable timeout limits
```

```bash
docs(sprint-01): add infrastructure setup guide

- Document Docker setup process
- Include troubleshooting section
- Add performance benchmarks
```

---

## NOMENCLATURA DE ISSUES Y TICKETS

### **FORMATO:**
```
[{MODULO}] {Descripción breve}
```

### **LABELS:**
- `sprint-01`, `sprint-02`, etc.
- `bug`, `enhancement`, `documentation`
- `priority-high`, `priority-medium`, `priority-low`
- `backend`, `python-service`, `database`

### **EJEMPLOS:**
- `[AUTH] Implement multi-factor authentication`
- `[SCRAPER] Add rate limiting for Twitter requests`
- `[DATABASE] Optimize queries for ai_analysis table`

---

## NOMENCLATURA DE ENDPOINTS API

### **FORMATO REST:**
```
/{version}/{recurso}/{accion}
```

### **EJEMPLOS:**
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id

GET    /api/v1/tenants/:tenantId/tweets
POST   /api/v1/tenants/:tenantId/tweets/bulk
GET    /api/v1/tenants/:tenantId/ai-analysis
POST   /api/v1/tenants/:tenantId/alerts

# WebSocket
WS     /ws/alerts/:tenantId
WS     /ws/dashboard/:tenantId
```

### **REGLAS:**
- Versión explícita (`v1`, `v2`)
- Recursos en plural
- Kebab-case para URLs compuestas
- Parámetros en camelCase

---

## NOMENCLATURA DE ENVIRONMENT VARIABLES

### **FORMATO:**
```
{SERVICIO}_{CATEGORIA}_{VARIABLE}
```

### **EJEMPLOS:**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thoth_db
DB_USER=postgres
DB_PASSWORD=secretpassword

# APIs externas
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-mini
OPENAI_MAX_TOKENS=1000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redispass

# Auth
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Servicios
SCRAPER_SERVICE_URL=http://localhost:8000
EXTRACTOR_SERVICE_URL=http://localhost:8001
```

---

## REGLAS GENERALES

### **DO's (Hacer):**
- ✅ Usar nombres descriptivos y claros
- ✅ Ser consistente en todo el proyecto
- ✅ Incluir contexto cuando sea necesario
- ✅ Usar inglés para código, español para documentación
- ✅ Seguir convenciones de cada lenguaje

### **DON'Ts (No hacer):**
- ❌ Abreviaciones confusas (`usr` en lugar de `user`)
- ❌ Nombres genéricos (`data`, `info`, `temp`)
- ❌ Mezclar idiomas en el mismo contexto
- ❌ Números sin contexto (`function1`, `variable2`)
- ❌ Espacios en nombres de archivos

---

**Nota:** Estas reglas son obligatorias para todo el equipo de desarrollo. Cualquier cambio debe ser documentado y comunicado.