# DECISIONES TÉCNICAS - SPRINT 4: AI PROCESSING

## DECISIÓN #1: Modelo OpenAI y Configuración
**Fecha:** 30/07/2025  
**Contexto:** Necesitamos elegir el modelo OpenAI más eficiente para análisis de contenido gubernamental con balance entre calidad y costo.

**Opciones consideradas:**
1. **GPT-4** - Pros: Máxima calidad / Cons: Alto costo ($0.03 por 1K tokens)
2. **GPT-4o-mini** - Pros: Balance calidad/costo ($0.0015 por 1K tokens) / Cons: Menor capacidad que GPT-4
3. **GPT-3.5-turbo** - Pros: Muy económico / Cons: Calidad inferior para análisis complejos

**Decisión:** GPT-4o-mini con temperature 0.3  
**Justificación:** 
- 20x más económico que GPT-4 
- Calidad suficiente para análisis gubernamental
- Temperature 0.3 balance entre precisión y creatividad
- response_format JSON garantiza estructura consistente

**Consecuencias:** 
- Costo estimado $0.10 por análisis completo
- Necesidad de optimizar prompts para máxima efectividad
- Monitoring estricto de costos requerido

---

## DECISIÓN #2: Tipos de Análisis IA Implementados
**Fecha:** 30/07/2025  
**Contexto:** Definir qué tipos de análisis IA implementar en el Sprint 4 basado en necesidades gubernamentales y capacidades técnicas.

**Opciones consideradas:**
1. **6 análisis completos** - Pros: Funcionalidad completa / Cons: Complejidad alta, tiempo desarrollo
2. **4 análisis core** - Pros: Balance funcionalidad/tiempo / Cons: Funcionalidad limitada
3. **2 análisis básicos** - Pros: Rápido desarrollo / Cons: Valor limitado

**Decisión:** 4 análisis especializados: Text, Sentiment, Entity Recognition, Risk Assessment  
**Justificación:**
- Text Analysis: Base fundamental para resúmenes ejecutivos
- Sentiment Analysis: Crítico para monitoreo gubernamental
- Entity Recognition: Esencial para identificar actores políticos
- Risk Assessment: Nuevo valor agregado para detección proactiva

**Consecuencias:**
- Desarrollo balanceado entre funcionalidad y tiempo
- Prompts especializados requeridos para cada análisis
- Posibilidad de agregar Trend Analysis y Relationship Mapping en sprints futuros

---

## DECISIÓN #3: Sistema de Queue y Workers
**Fecha:** 30/07/2025  
**Contexto:** Necesitamos procesar jobs de `aiProcessingQueue` de manera eficiente sin bloquear la API principal.

**Opciones consideradas:**
1. **Bull Queue con Redis** - Pros: Robusto, retry logic, monitoring / Cons: Dependencia adicional
2. **Procesamiento síncrono** - Pros: Simplicidad / Cons: Bloquea API, no escalable
3. **Cron jobs simples** - Pros: Fácil setup / Cons: No tiempo real, menos control

**Decisión:** Bull Queue con Redis backend  
**Justificación:**
- Redis ya disponible en infraestructura Docker
- Bull provee retry logic automático para fallos OpenAI
- Monitoring y debugging capabilities integradas
- Escalabilidad horizontal futura

**Consecuencias:**
- Necesidad de instalar @nestjs/bull y bull
- Worker separado para procesamiento background
- Complejidad adicional en setup pero mayor robustez

---

## DECISIÓN #4: Estructura de Prompts Especializados
**Fecha:** 30/07/2025  
**Contexto:** Diseñar prompts que generen análisis consistentes y relevantes para contexto gubernamental mexicano.

**Opciones consideradas:**
1. **Prompts genéricos** - Pros: Simplicidad / Cons: Baja relevancia gubernamental
2. **Prompts especializados por análisis** - Pros: Alta relevancia / Cons: Mayor complejidad mantenimiento
3. **Sistema híbrido** - Pros: Balance / Cons: Complejidad media

**Decisión:** Prompts especializados por tipo de análisis con contexto gubernamental mexicano  
**Justificación:**
- Análisis más relevante para toma de decisiones gubernamentales
- Terminología específica del sector público mexicano
- Outputs estructurados en JSON para consistencia
- Enfoque en impacto político y riesgos institucionales

**Consecuencias:**
- Necesidad de PromptsService especializado
- Testing exhaustivo de cada prompt
- Posible necesidad de ajustes basados en resultados reales

---

## DECISIÓN #5: Sistema de Tracking de Costos
**Fecha:** 30/07/2025  
**Contexto:** Implementar monitoreo de costos OpenAI para control presupuestario y optimización.

**Opciones consideradas:**
1. **Tracking detallado por operación** - Pros: Control granular / Cons: Overhead storage
2. **Tracking agregado diario** - Pros: Simplicidad / Cons: Menos visibilidad
3. **Sin tracking** - Pros: Desarrollo rápido / Cons: Riesgo presupuestario

**Decisión:** Tracking detallado por operación con agregaciones  
**Justificación:**
- Control granular necesario para optimización
- Transparencia total de costos por tipo de análisis
- Base para future budgeting y forecasting
- Alertas automáticas por umbrales de gasto

**Consecuencias:**
- Campo cost en tabla aiAnalysis
- Servicio de cost tracking separado
- Dashboard de costos en endpoints de monitoreo
- Necesidad de configurar umbrales de alerta