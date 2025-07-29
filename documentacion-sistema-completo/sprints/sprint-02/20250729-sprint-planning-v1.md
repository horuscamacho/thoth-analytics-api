# SPRINT PLANNING - MÓDULO 2: AUTH & MULTI-TENANCY

**Fecha:** 29 de Julio 2025  
**Sprint:** 02  
**Duración:** 1 semana (5 días laborales)  
**Equipo:** 1 Full Stack Developer + AI Assistant

## 🎯 OBJETIVO DEL SPRINT

Implementar sistema completo de autenticación JWT con multi-tenancy, incluyendo guards, middleware, roles de usuario y aislamiento de datos por tenant. El sistema debe soportar los 4 tipos de usuarios definidos en las user stories con permisos granulares.

**Meta específica:** Tener un sistema de auth funcionando donde usuarios puedan hacer login, obtener tokens JWT, acceder solo a datos de su tenant, y tener permisos basados en su rol (Director, Gobernador, Secretario, Subordinado).

---

## 📋 USER STORIES INCLUIDAS

### **Historia Principal:**
- **US-AUTH-001**: Como usuario del sistema, quiero autenticarme con email/password para acceder a la plataforma
- **US-AUTH-002**: Como sistema, quiero aislar completamente los datos entre diferentes tenants
- **US-AUTH-003**: Como usuario, quiero que mi sesión se mantenga activa y se renueve automáticamente

### **Historias de Soporte:**
- **US-AUTH-004**: Como Director de Comunicación, quiero tener acceso completo a todas las funciones
- **US-AUTH-005**: Como Gobernador, quiero tener acceso limitado sin poder modificar configuraciones
- **US-AUTH-006**: Como Secretario, quiero tener el mismo acceso que el Gobernador
- **US-AUTH-007**: Como Subordinado, quiero tener acceso muy limitado solo a consultas básicas

---

## ✅ DEFINICIÓN DE HECHO

### **Criterios Obligatorios:**
- [ ] **Login endpoint funcional** - `POST /auth/login` con email/password
- [ ] **JWT tokens generados** - Access token + refresh token
- [ ] **Middleware de autenticación** - Validación automática de tokens
- [ ] **Guards de autorización** - Verificación de roles y permisos
- [ ] **Multi-tenant isolation** - Datos completamente aislados por tenant
- [ ] **Refresh token flow** - Renovación automática de tokens
- [ ] **Logout functionality** - Invalidación de tokens
- [ ] **Password hashing** - Bcrypt para seguridad

### **Criterios de Calidad:**
- [ ] **Tests de seguridad** - Validación de permisos y accesos
- [ ] **Error handling** - Mensajes claros para fallos de auth
- [ ] **Token validation** - Verificación de expiración y firma
- [ ] **Role-based access** - Permisos granulares por rol
- [ ] **Tenant context** - Header X-Tenant-ID requerido

### **Criterios de API:**
- [ ] **Endpoints documentados** - Colección Insomnia actualizada
- [ ] **Response consistency** - Formato estándar de respuestas
- [ ] **Security headers** - CORS, security headers apropiados
- [ ] **Rate limiting** - Protección contra ataques

---

## 🏗️ TAREAS TÉCNICAS DETALLADAS

### **DÍA 1: Setup de Autenticación**
1. **Instalar dependencias JWT**
   - `@nestjs/jwt`
   - `@nestjs/passport`
   - `passport-jwt`
   - `bcryptjs`
   
2. **Configurar JWT Module**
   - Secrets y configuración
   - Access + Refresh token strategy
   
3. **Crear AuthService**
   - Login logic
   - Token generation
   - Password hashing

### **DÍA 2: Guards y Middleware**
1. **Crear JWT Strategy**
   - Token validation
   - User payload extraction
   
2. **Implementar Auth Guard**
   - Route protection
   - Token verification
   
3. **Crear Tenant Middleware**
   - X-Tenant-ID validation
   - Tenant context injection

### **DÍA 3: Multi-Tenancy**
1. **Tenant Isolation Service**
   - Prisma tenant filtering
   - Context management
   
2. **Role-based Guards**
   - Permission checking
   - Role hierarchy
   
3. **Seed inicial de datos**
   - Tenants de ejemplo
   - Usuarios con roles

### **DÍA 4: Endpoints y Validación**
1. **Auth endpoints**
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/logout
   
2. **User management**
   - GET /users (filtered by tenant)
   - POST /users (tenant isolation)
   
3. **Validation pipes**
   - DTO validation
   - Security validations

### **DÍA 5: Testing y Documentación**
1. **Security testing**
   - Permission tests
   - Tenant isolation tests
   
2. **Insomnia collection**
   - Auth flow complete
   - Variables and scripts
   
3. **Documentation**
   - Auth flow diagram
   - Security decisions

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Configuración compleja de JWT** | Alta | Alto | Usar @nestjs/jwt oficial, ejemplos documentados |
| **Tenant isolation bugs** | Media | Crítico | Tests exhaustivos, middleware obligatorio |
| **Performance issues con guards** | Media | Medio | Cache de permisos, optimización de queries |
| **Security vulnerabilities** | Baja | Crítico | Code review riguroso, tests de penetración |
| **Token management complexity** | Alta | Medio | Refresh tokens, clear expiration strategy |

---

## 🔗 DEPENDENCIAS

### **Externas:**
- Sprint 01 completado (Base infrastructure)
- Prisma schema con User/Tenant models
- Redis funcionando para token caching

### **Internas:**
- Database con datos seed
- Health checks operativos
- Environment variables configuradas

### **Decisiones Pendientes:**
- Duración de tokens (access vs refresh)
- Estrategia de logout (blacklist vs short expiry)
- Rate limiting específico para auth endpoints

---

## 📊 ESTIMACIÓN DETALLADA

### **Breakdown por Tareas:**
- **JWT Setup + Config:** 4 horas
- **AuthService + Password:** 4 horas  
- **Guards + Middleware:** 6 horas
- **Multi-tenant isolation:** 6 horas
- **Role-based permissions:** 4 horas
- **API endpoints:** 4 horas
- **Testing + Security:** 6 horas
- **Documentation + Collection:** 4 horas
- **Debugging + Polish:** 2 horas

**Total estimado:** 40 horas (5 días)  
**Buffer incluido:** Ya considerado en tareas  
**Total sprint:** 40 horas (5 días)

### **Recursos:**
- **1 Full Stack Developer:** 100% tiempo
- **AI Assistant:** Disponible para consultas
- **Security review:** 2 horas consulta externa

---

## 🎯 MÉTRICAS DE ÉXITO

### **Funcionales:**
- ✅ Login completo en < 500ms
- ✅ Token validation en < 50ms
- ✅ Tenant isolation 100% efectivo
- ✅ Role permissions funcionando correctamente

### **Calidad:**
- ✅ 0 errores de linting
- ✅ Security tests pasando 100%
- ✅ API response time < 200ms
- ✅ Error handling comprehensive

### **Seguridad:**
- ✅ Passwords hasheados con bcrypt
- ✅ JWT tokens signed y verified
- ✅ No tenant data leakage
- ✅ Rate limiting implementado

---

## 📋 CHECKLIST FINAL

### **Pre-Sprint:**
- [x] Rama `sprint-02-auth-multitenancy` creada
- [x] Planning documentado
- [x] Dependencies identificadas

### **Durante Sprint:**
- [ ] Daily notes actualizados
- [ ] Commits frecuentes con mensajes claros
- [ ] Security tests ejecutándose
- [ ] Insomnia collection actualizada

### **Post-Sprint:**
- [ ] Todos los criterios de hecho verificados
- [ ] Security review completado
- [ ] Retrospectiva documentada
- [ ] Merge a main completado

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### **JWT Security:**
- **Secret rotation:** Configuración para rotar secrets
- **Token expiration:** Access tokens cortos (15-30 min)
- **Refresh tokens:** Más largos pero revocables
- **Signature validation:** Verificación estricta

### **Multi-Tenancy Security:**
- **Complete isolation:** Zero data leakage between tenants
- **Middleware enforcement:** X-Tenant-ID obligatorio
- **Database filtering:** Prisma tenant filtering automático
- **Audit logging:** Log de accesos por tenant

### **Role-Based Access:**
- **Hierarchical permissions:** Director > Gobernador > Secretario > Subordinado
- **Granular controls:** Feature-level permissions
- **Context-aware:** Permisos basados en tenant + role
- **Fail-secure:** Default deny, explicit allow

---

## 📞 CONTACTOS Y ESCALAMIENTO

### **Decisiones Técnicas:**
- **Primary:** Horus (Product Owner + Tech Lead)
- **Security Consultant:** Claude (Architecture & Security)

### **Bloqueadores:**
- **JWT/Security Issues:** Security team consultation
- **Performance Issues:** Database optimization review
- **Multi-tenancy:** Architecture review session

---

**NOTA:** Este planning debe ser revisado después del Día 2 para ajustar estimaciones según progreso real con multi-tenancy.