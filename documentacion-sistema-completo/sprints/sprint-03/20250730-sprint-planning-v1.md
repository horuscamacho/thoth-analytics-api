# SPRINT PLANNING - M�DULO 3: SCRAPER INTEGRATION

**Fecha:** 30 de Julio 2025  
**Sprint:** sprint-03-scraper-integration  
**Duraci�n:** 3-5 d�as  
**Objetivo:** Crear API NestJS para recibir datos del scraper Python

---

## <� OBJETIVO DEL SPRINT

Implementar la API REST en NestJS que recibir� datos del scraper Python (a desarrollar en m�dulos posteriores), validar� la informaci�n, la almacenar� en la base de datos y la preparar� para procesamiento IA.

**Scope:** Solo API NestJS - NO incluye desarrollo del servidor Python scraper.

---

## =� USER STORIES INCLUIDAS

### **US-C001: Recibir datos de tweets del scraper**
- **Como** scraper Python futuro
- **Quiero** enviar tweets capturados via POST /scrapers/tweets
- **Para que** se almacenen correctamente en la base de datos
- **Criterios:**
  - [ ] Endpoint POST /scrapers/tweets funcional
  - [ ] Valida estructura de datos de entrada
  - [ ] Almacena en tabla `tweets` con relaciones correctas
  - [ ] Genera contentHash autom�ticamente para detectar duplicados
  - [ ] Crea jobs en `ai_processing_queue` autom�ticamente
  - [ ] Maneja errores con responses consistentes

### **US-C002: Validar datos de entrada robustamente**
- **Como** sistema API
- **Quiero** validar todos los campos de tweets antes de almacenar
- **Para que** mantenga integridad y consistencia de datos
- **Criterios:**
  - [ ] Usa class-validator para validaciones
  - [ ] Valida tweetId �nico y formato correcto
  - [ ] Valida contenido no vac�o y longitud apropiada
  - [ ] Valida fechas en formato ISO v�lido
  - [ ] Valida arrays de hashtags y mentions
  - [ ] Valida URLs de media si est�n presentes
  - [ ] Retorna errores 400 con detalles espec�ficos

### **US-C003: Controlar velocidad de ingesta (Rate Limiting)**
- **Como** sistema API
- **Quiero** controlar la velocidad de ingesta de datos
- **Para que** no sature la base de datos ni consuma recursos excesivos
- **Criterios:**
  - [ ] Implementa ThrottlerModule de NestJS
  - [ ] L�mite: 100 requests/minuto por IP
  - [ ] L�mite espec�fico: 1000 tweets/hora por tenant
  - [ ] Respuesta 429 cuando excede l�mites
  - [ ] Headers informativos sobre l�mites restantes
  - [ ] Configuraci�n para bypass de IPs espec�ficas

### **US-C004: Healthcheck para monitoreo**
- **Como** scraper Python y DevOps
- **Quiero** verificar estado de la API y servicios
- **Para que** sepa si puede enviar datos y monitorear salud del sistema
- **Criterios:**
  - [ ] GET /scrapers/health retorna 200 cuando todo OK
  - [ ] Verifica conexi�n a base de datos
  - [ ] Verifica servicios dependientes (Redis si aplica)
  - [ ] Tiempo de respuesta < 100ms
  - [ ] Incluye informaci�n de versi�n y uptime
  - [ ] Formato JSON consistente

### **US-C005: Recibir datos de noticias extra�das**
- **Como** extractor Python futuro
- **Quiero** enviar noticias extra�das via POST /scrapers/news
- **Para que** se almacenen con relaci�n correcta al tweet origen
- **Criterios:**
  - [ ] Endpoint POST /scrapers/news funcional
  - [ ] Valida estructura de datos de noticias
  - [ ] Almacena en tabla `news` con FK a tweets
  - [ ] Genera contentHash para detectar duplicados
  - [ ] Crea jobs de an�lisis IA para noticias

---

##  DEFINICI�N DE HECHO

### **Funcionalidad:**
- [ ] Todos los endpoints funcionan correctamente
- [ ] Validaciones completas implementadas
- [ ] Rate limiting configurado y probado
- [ ] Healthcheck responde apropiadamente
- [ ] Datos se almacenan correctamente en BD
- [ ] Jobs de IA se crean autom�ticamente

### **Calidad:**
- [ ] Cobertura de tests > 80%
- [ ] Tests unitarios para service y controller
- [ ] Tests e2e para endpoints principales
- [ ] Linting sin errores (npm run lint)
- [ ] TypeScript strict sin errores
- [ ] C�digo sigue nomenclatura establecida

### **Documentaci�n:**
- [ ] Sprint planning completo
- [ ] Daily notes actualizadas
- [ ] Technical decisions documentadas
- [ ] API collection actualizada con nuevos endpoints
- [ ] Sprint retrospective al final

### **Performance:**
- [ ] API response time < 200ms p95
- [ ] Database queries optimizadas
- [ ] Memory leaks verificados
- [ ] Manejo apropiado de errores

---

## � RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigaci�n |
|--------|--------------|---------|------------|
| Estructura de datos del scraper no definida | Alta | Alto | Definir formato esperado basado en schema existente |
| Performance con volumen alto de tweets | Media | Alto | Implementar batch processing y rate limiting |
| Validaciones muy estrictas bloquean datos v�lidos | Media | Medio | Tests exhaustivos con datos reales simulados |
| Rate limiting muy restrictivo | Baja | Medio | Configuraci�n flexible y bypasses |

---

## = DEPENDENCIAS

### **Internas:**
-  Sistema de autenticaci�n (Sprint 2 completado)
-  Base de datos con tablas tweets, news, ai_processing_queue
-  PrismaService funcionando

### **Externas:**
- � Definici�n exacta del formato de datos del scraper Python
- � Volumen esperado de datos para calibrar rate limiting
- � Requisitos espec�ficos de performance

### **T�cnicas:**
- ThrottlerModule (@nestjs/throttler) - a instalar si necesario
- class-validator y class-transformer (ya instalados)
- crypto module para contentHash

---

## =� ESTIMACI�N

- **Esfuerzo total:** 25-30 puntos de historia
- **Duraci�n estimada:** 3-5 d�as
- **Recursos:** 1 desarrollador + 1 AI assistant
- **Complejidad:** Media (validaciones complejas, rate limiting)

### **Desglose por d�a:**
- **D�a 1:** Setup + Planning + ScrapersModule b�sico (6h)
- **D�a 2:** ScrapersService + DTOs + validaciones (8h)
- **D�a 3:** ScrapersController + endpoints (6h)
- **D�a 4:** Rate limiting + healthcheck (6h)
- **D�a 5:** Tests + documentaci�n + retrospective (4h)

---

## =� ARQUITECTURA T�CNICA

### **Componentes a crear:**
```
src/scrapers/
   scrapers.module.ts          # M�dulo principal
   scrapers.service.ts         # L�gica de negocio
   scrapers.controller.ts      # Endpoints REST
   scrapers.service.spec.ts    # Tests unitarios service
   scrapers.controller.spec.ts # Tests unitarios controller
   dto/
       create-tweet.dto.ts     # Validaciones para tweets
       create-news.dto.ts      # Validaciones para noticias
       scraper-response.dto.ts # Responses consistentes
       health-check.dto.ts     # Response de healthcheck
```

### **Flujo de datos:**
1. Scraper Python � POST /scrapers/tweets � Validaci�n � BD tweets
2. Tweet guardado � Trigger � ai_processing_queue job creado
3. Extractor Python � POST /scrapers/news � Validaci�n � BD news
4. News guardada � Trigger � ai_processing_queue job creado

### **Tecnolog�as:**
- NestJS con decoradores y guards
- Prisma ORM para BD
- class-validator para validaciones
- @nestjs/throttler para rate limiting
- crypto para contentHash
- Jest para testing

---

## =� M�TRICAS DE �XITO

### **Funcionales:**
- 100% de endpoints implementados y funcionando
- 0 errores de validaci�n en datos v�lidos
- 100% de datos inv�lidos rechazados apropiadamente
- Rate limiting funciona sin falsos positivos

### **T�cnicas:**
- Cobertura de tests > 80%
- Response time < 200ms p95
- 0 memory leaks detectados
- 0 errores de TypeScript

### **Proceso:**
- Daily notes actualizadas cada d�a
- Decisiones t�cnicas documentadas
- Retrospective completa al final
- API collection 100% actualizada

---

**Preparado para comenzar desarrollo el 30 de Julio 2025**  
**Estado:**  PLANNING COMPLETADO - LISTO PARA DESARROLLO