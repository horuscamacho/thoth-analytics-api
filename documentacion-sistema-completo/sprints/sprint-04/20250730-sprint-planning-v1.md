# SPRINT PLANNING - MÓDULO 4: AI PROCESSING

**Fecha de inicio:** 30 de Julio 2025  
**Duración estimada:** 5-7 días  
**Sprint:** 04  
**Módulo:** AI Processing  

---

## 🎯 OBJETIVO DEL SPRINT

Implementar sistema de procesamiento de inteligencia artificial para analizar contenido scrapeado (tweets y noticias) con análisis multi-capa que extraiga insights profundos, detecte riesgos gubernamentales y genere alertas automáticas basadas en criterios de relevancia política.

## 📋 USER STORIES INCLUIDAS

- [ ] **US-AI001**: Como sistema, quiero analizar tweets y noticias scrapeadas para extraer insights profundos
  - **Criterio**: 4 tipos de análisis IA funcionando correctamente
  - **Estimación**: 3 puntos de historia

- [ ] **US-AI002**: Como sistema, quiero detectar riesgos en contenido monitoreado
  - **Criterio**: Risk assessment con score y categorías implementado
  - **Estimación**: 2 puntos de historia

- [ ] **US-AI003**: Como sistema, quiero identificar entidades políticas relevantes
  - **Criterio**: Entity recognition extrayendo personas, organizaciones, ubicaciones
  - **Estimación**: 2 puntos de historia

- [ ] **US-AI004**: Como administrador, quiero monitorear costos de procesamiento IA
  - **Criterio**: Tracking de costos OpenAI por operación funcionando
  - **Estimación**: 1 punto de historia

- [ ] **US-AI005**: Como sistema, quiero generar alertas por contenido crítico
  - **Criterio**: Sistema de alertas automáticas por risk score y sentiment
  - **Estimación**: 2 puntos de historia

**Total estimado:** 10 puntos de historia

## ✅ DEFINICIÓN DE HECHO

### Criterios Técnicos:
- [ ] AiProcessingModule completamente implementado con service y controller
- [ ] 4 tipos de análisis IA funcionando: Text, Sentiment, Entity Recognition, Risk Assessment
- [ ] Worker de queue procesando jobs de `aiProcessingQueue` automáticamente
- [ ] Cliente OpenAI configurado con parámetros optimizados (gpt-4o-mini, temp 0.3)
- [ ] Sistema de tracking de costos por operación implementado
- [ ] Endpoints REST para monitoreo y gestión funcionando
- [ ] Tests unitarios con cobertura mínima 80%

### Criterios de Performance:
- [ ] Procesamiento de un análisis completo en < 15 segundos
- [ ] Queue worker procesando jobs sin bloqueos
- [ ] Manejo robusto de errores OpenAI con retry logic
- [ ] Memoria y CPU estables durante procesamiento continuo

### Criterios de Calidad:
- [ ] Prompts especializados optimizados para análisis gubernamental mexicano
- [ ] Respuestas JSON estructuradas y consistentes
- [ ] Logging detallado de operaciones y errores
- [ ] Documentación de endpoints actualizada

### Criterios de Integración:
- [ ] Build sin errores de TypeScript
- [ ] Tests unitarios pasando al 100%
- [ ] Integración con Sprint 3 (ScrapersModule) funcionando
- [ ] Base de datos actualizada con resultados de análisis

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Rate limits de OpenAI | Media | Alto | Implementar throttling y queues con delays |
| Costos elevados OpenAI | Alta | Medio | Usar gpt-4o-mini, optimizar prompts, tracking estricto |
| Prompts inconsistentes | Media | Alto | Testing exhaustivo de prompts, validación JSON |
| Queue worker fallos | Baja | Alto | Retry logic, dead letter queue, monitoring |
| Timeout en análisis largos | Media | Medio | Configurar timeouts apropiados, chunking de contenido |

## 🔗 DEPENDENCIAS

### Dependencias Externas:
- [ ] API Key de OpenAI válida y con créditos suficientes
- [ ] Conectividad estable a internet para OpenAI API
- [ ] Acceso a npm registry para instalación de dependencias

### Dependencias Internas:
- [x] **Sprint 3 completado**: ScrapersModule funcionando y creando jobs en `aiProcessingQueue`
- [x] **Base de datos**: Tablas `Tweet`, `News`, `AiProcessingQueue`, `AiAnalysis` existentes
- [x] **Infraestructura**: PostgreSQL y Redis funcionando en Docker

### Dependencias de Código:
- [x] **PrismaService**: Para acceso a base de datos
- [x] **AuditService**: Para logging de operaciones IA
- [ ] **ConfigService**: Para configuración de OpenAI API Key

## 📊 ESTIMACIÓN

### Esfuerzo por Componente:
- **AiProcessingModule + setup**: 1 día
- **AiAnalysisService (4 análisis)**: 2.5 días
- **AiProcessingController**: 0.5 días
- **Queue Worker**: 1 día
- **Cost Tracking**: 0.5 días
- **Tests unitarios**: 1 día
- **Integración y debugging**: 0.5 días

**Duración total estimada:** 7 días  
**Recursos:** 1 desarrollador (Claude + Horus)  
**Riesgo temporal:** Medio (puede extenderse por ajustes de prompts)

## 🔧 STACK TECNOLÓGICO

### Nuevas Dependencias:
```json
{
  "openai": "^4.28.4",
  "@nestjs/bull": "^10.0.1",
  "bull": "^4.12.2"
}
```

### Configuración OpenAI:
```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.3,
  max_tokens: 2000,
  response_format: { type: 'json_object' }
}
```

### Arquitectura de Análisis:
```
Tweet/News → AiProcessingQueue → Worker → OpenAI API → AiAnalysis → Alerts
```

## 📈 MÉTRICAS DE ÉXITO

### Métricas Funcionales:
- **Análisis completados**: > 95% de jobs procesados exitosamente
- **Tiempo de procesamiento**: < 15 segundos promedio por análisis
- **Calidad de análisis**: Validación JSON 100% exitosa
- **Cobertura de pruebas**: > 80% de cobertura de código

### Métricas de Performance:
- **Throughput**: Procesar mínimo 100 análisis/hora
- **Error rate**: < 5% de errores por timeouts o fallos API
- **Memory usage**: < 512MB en promedio para el worker
- **API response time**: < 2 segundos para endpoints de monitoreo

### Métricas de Negocio:
- **Cost efficiency**: < $0.10 USD por análisis completo
- **Alert accuracy**: Validación manual de 20 alertas generadas
- **Entity extraction**: > 90% precisión en entidades gubernamentales
- **Risk detection**: Identificación de 100% de contenido crítico de prueba

---

**Aprobado por:** Horus Camacho  
**Revisado por:** Claude Code  
**Fecha de aprobación:** 30 de Julio 2025