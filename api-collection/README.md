# THOTH ANALYTICS API - COLECCIÓN INSOMNIA

**Fecha:** 29 de Julio 2025  
**Propósito:** Documentación y configuración de la colección de API para Insomnia

## 📋 CONFIGURACIÓN INICIAL

### **1. Instalación de Insomnia**
```bash
# macOS
brew install --cask insomnia

# O descargar desde: https://insomnia.rest/download
```

### **2. Importar Colección**
1. Abrir Insomnia
2. Click en "Create" → "Import"
3. Seleccionar archivo `thoth-analytics-api-collection.json`
4. Verificar que se importó correctamente

### **3. Configurar Variables de Entorno**
En Insomnia, ir a **Manage Environments** y configurar:

```json
{
  "base_url": "http://localhost:3000",
  "api_version": "v1",
  "auth_token": "",
  "refresh_token": "",
  "tenant_id": "",
  "user_id": ""
}
```

## 🔐 CONFIGURACIÓN DE AUTENTICACIÓN

### **Scripts de Pre-request (JavaScript)**

#### **1. Auto Token Refresh**
```javascript
// Pre-request Script para endpoints que requieren autenticación
const token = insomnia.environment.auth_token;
const refreshToken = insomnia.environment.refresh_token;

// Verificar si el token está por expirar
if (!token || isTokenExpired(token)) {
  // Hacer refresh del token
  await refreshAuthToken();
}

function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < (now + 300); // 5 minutos de buffer
  } catch (e) {
    return true;
  }
}

async function refreshAuthToken() {
  const response = await insomnia.send({
    url: `${insomnia.environment.base_url}/auth/refresh`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      refresh_token: insomnia.environment.refresh_token
    }
  });
  
  if (response.status === 200) {
    const data = JSON.parse(response.body);
    insomnia.environment.auth_token = data.access_token;
    insomnia.environment.refresh_token = data.refresh_token;
  }
}
```

#### **2. Tenant Context Setup**
```javascript
// Para endpoints multi-tenant
const tenantId = insomnia.environment.tenant_id;

if (!tenantId) {
  throw new Error('tenant_id no configurado en variables de entorno');
}

// Agregar tenant_id a headers automáticamente
insomnia.request.setHeader('X-Tenant-ID', tenantId);
```

## 📁 ESTRUCTURA DE LA COLECCIÓN

### **Carpetas Principales:**

```
📁 Thoth Analytics API
├── 📁 Auth & Security (✅ IMPLEMENTADO)
│   ├── 🔐 Login
│   ├── 🔄 Refresh Token
│   ├── 🚪 Logout
│   ├── 👤 Get Profile
│   ├── 🔒 Admin Only Endpoint
│   └── 🏢 Management Only Endpoint
│
├── 📁 Health Checks (✅ IMPLEMENTADO)
│   ├── 🏠 Welcome Message
│   ├── ✅ API Health Check
│   ├── 🗄️ Database Health Check
│   ├── 🔴 Redis Health Check
│   └── 🏥 Full System Health Check
│
├── 📁 Users Management
│   ├── 👤 Get Users
│   ├── 👤 Create User
│   ├── 👤 Get User by ID
│   ├── 👤 Update User
│   └── 👤 Delete User
│
├── 📁 Tweets Processing
│   ├── 🐦 Receive Tweet
│   ├── 🐦 Get Tweets
│   ├── 🐦 Get Tweet by ID
│   └── 🐦 Bulk Tweet Upload
│
├── 📁 News Analysis
│   ├── 📰 Extract News from Tweet
│   ├── 📰 Get News
│   ├── 📰 Get News by ID
│   └── 📰 Analyze News Content
│
├── 📁 AI Analysis
│   ├── 🤖 Process Tweet Analysis
│   ├── 🤖 Process News Analysis
│   ├── 🤖 Get Analysis Results
│   └── 🤖 Reprocess Analysis
│
└── 📁 Alerts System
    ├── 🚨 Get Active Alerts
    ├── 🚨 Create Manual Alert
    ├── 🚨 Mark Alert as Read
    └── 🚨 Get Alert History
```

## 🔧 MANTENIMIENTO DE LA COLECCIÓN

### **Reglas Obligatorias:**

1. **Cada endpoint nuevo** debe agregarse inmediatamente
2. **Actualizar ejemplos** de request/response
3. **Mantener scripts** de autenticación funcionando
4. **Documentar parámetros** requeridos y opcionales
5. **Incluir casos de error** comunes

### **Template para Nuevos Endpoints:**

```json
{
  "name": "📍 Nombre del Endpoint",
  "method": "POST",
  "url": "{{ base_url }}/api/{{ api_version }}/resource",
  "headers": [
    {
      "name": "Authorization",
      "value": "Bearer {{ auth_token }}"
    },
    {
      "name": "X-Tenant-ID",
      "value": "{{ tenant_id }}"
    },
    {
      "name": "Content-Type",
      "value": "application/json"
    }
  ],
  "body": {
    "mimeType": "application/json",
    "text": "{\n  \"example\": \"value\"\n}"
  },
  "parameters": [],
  "authentication": {},
  "metaSortKey": -1627847064515,
  "isPrivate": false,
  "settingStoreCookies": true,
  "settingSendCookies": true,
  "settingDisableRenderRequestBody": false,
  "settingEncodeUrl": true,
  "settingRebuildPath": true,
  "description": "Descripción detallada del endpoint y su propósito"
}
```

## 📊 TESTING Y VALIDACIÓN

### **Tests Automáticos en Insomnia:**

```javascript
// Test básico de response
const response = await insomnia.send();

// Validar status code
expect(response.status).to.equal(200);

// Validar estructura de response
const data = JSON.parse(response.body);
expect(data).to.have.property('status');
expect(data).to.have.property('data');

// Guardar datos para siguientes requests
if (data.access_token) {
  insomnia.environment.auth_token = data.access_token;
}
```

## 🔄 WORKFLOW DE ACTUALIZACIÓN

### **Proceso cuando se agrega un endpoint:**

1. **Crear el endpoint** en Insomnia siguiendo el template
2. **Probar manualmente** que funciona
3. **Agregar tests** de validación
4. **Documentar parámetros** y responses
5. **Exportar colección** actualizada
6. **Commit cambios** al repositorio

### **Comandos útiles:**

```bash
# Exportar colección desde Insomnia
# File → Export Data → Export Collection → JSON

# Mover archivo exportado al proyecto
mv ~/Downloads/thoth-analytics-api.json api-collection/thoth-analytics-api-collection.json

# Commit cambios
git add api-collection/
git commit -m "feat(api): update Insomnia collection with new endpoints"
```

## 📝 DOCUMENTACIÓN POR MÓDULO

### **Health Checks (Implementado):**
- ✅ `GET /` - Mensaje de bienvenida
- ✅ `GET /health` - Health check básico de la API
- ✅ `GET /health/db` - Health check de PostgreSQL con Prisma (incluye versión)
- ✅ `GET /health/redis` - Health check de Redis cache  
- ✅ `GET /health/full` - Health check completo del sistema (API + DB + Redis)

### **Auth & Security (Implementado):**
- ✅ `POST /auth/login` - Autenticación con email, password y tenant ID
- ✅ `POST /auth/refresh` - Renovación de tokens con refresh token
- ✅ `POST /auth/logout` - Cierre de sesión (requiere autenticación)
- ✅ `GET /auth/profile` - Información del perfil del usuario autenticado
- ✅ `GET /auth/admin-only` - Endpoint exclusivo para rol DIRECTOR
- ✅ `GET /auth/management-only` - Endpoint para roles DIRECTOR, GOBERNADOR, SECRETARIO

### **Por Implementar:**
- 👤 **Users Module** - CRUD de usuarios
- 🐦 **Tweets Module** - Procesamiento de tweets
- 📰 **News Module** - Extracción y análisis de noticias
- 🤖 **AI Analysis Module** - Procesamiento con IA
- 🚨 **Alerts Module** - Sistema de alertas

---

**NOTA:** Esta colección debe mantenerse actualizada en cada sprint. Es la única fuente de verdad para testing de la API.