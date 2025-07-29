# DIAGRAMA DE GANTT - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Duración Total:** 16 semanas  
**Inicio:** Semana 1 (Agosto 2025)  
**Demo:** Semana 16 (Noviembre 2025)

## DIAGRAMA DE GANTT

```
MÓDULO/TAREA                    S1  S2  S3  S4  S5  S6  S7  S8  S9  S10 S11 S12 S13 S14 S15 S16
================================================================================================

FASE 1: FUNDACIÓN
M1: Infraestructura Base        ████
  - Setup NestJS                ██
  - PostgreSQL + Prisma           ██
  - Docker Compose                 ██
  - CI/CD Básico                    ██

M2: Auth & Multi-tenancy            ████████████
  - JWT + Refresh Tokens              ████
  - MFA Implementation                   ████
  - Tenant Isolation                        ████
  - CRUD Usuarios                             ████

FASE 2: INTEGRACIÓN
M3: Integración Scraper                     ██████
  - API Endpoints                             ████
  - Validación/Dedup                           ████
  - Queue Creation                               ██

M7: Extractor Noticias                      ██████
  - Microservicio Python                      ████
  - Selectores Config                          ████
  - URL Resolution                               ██

FASE 3: INTELIGENCIA  
M4: Procesamiento IA                                ████████
  - OpenAI Integration                                ████
  - Worker Queue                                        ████
  - Prompts Optimization                                 ████
  - Cache & Retry                                          ████

FASE 4: VISUALIZACIÓN
M5: Dashboard & Viz                                     ████████████
  - API Endpoints                                         ████
  - Real-time Metrics                                      ████
  - Filters & Search                                         ████
  - WebSocket Updates                                           ████

M6: Sistema de Alertas                                              ████████
  - Rules Engine                                                      ████
  - Multi-channel Delivery                                             ████
  - Alert Grouping                                                       ████
  - User Configuration                                                     ████

FASE 5: OPTIMIZACIÓN
M8: Análisis Avanzado                                                       ████████
  - Embeddings Generation                                                     ████
  - Clustering Algorithm                                                        ████
  - Campaign Detection                                                            ████
  - Pattern Dashboard                                                               ████

Testing & Debugging             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
Documentation                   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
Performance Optimization                                                            ░░░░████████

================================================================================================
MILESTONES                      ▼       ▼           ▼               ▼                       ▼
                                Auth    Data        IA              MVP                    DEMO
                                Done    Flowing     Working         Complete               Ready

```

## LEYENDA
- `████` Trabajo activo en el módulo
- `░░░░` Trabajo continuo de baja intensidad
- `▼` Milestone importante

---

## DEPENDENCIAS CRÍTICAS

```
┌─────────────────┐
│ Infraestructura │
└────────┬────────┘
         │
    ┌────▼────┐     ┌──────────────┐
    │  Auth   │────▶│  Dashboard   │
    └────┬────┘     └──────────────┘
         │
    ┌────▼────┐     ┌──────────────┐
    │ Scraper │────▶│ Procesamiento│
    └─────────┘     │      IA      │
         │          └───────┬──────┘
         │                  │
    ┌────▼────┐            │
    │Extractor│            │
    └─────────┘            │
                           ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Alertas    │────▶│  Clustering  │
                    └──────────────┘     └──────────────┘
```

---

## CARGA DE TRABAJO POR SEMANA

### **Semanas 1-4: ALTA CARGA**
- Setup inicial intensivo
- Arquitectura base crítica
- **40-50 horas/semana**

### **Semanas 5-8: CARGA MEDIA**
- Desarrollo estable
- Integraciones complejas
- **35-40 horas/semana**

### **Semanas 9-12: ALTA CARGA**
- UI/UX intensivo
- Integración de componentes
- **40-45 horas/semana**

### **Semanas 13-16: CARGA VARIABLE**
- Features avanzados
- Testing y debugging
- **30-40 horas/semana**

---

## PUNTOS DE CONTROL (CHECKPOINTS)

### **CHECKPOINT 1 - Semana 3**
**Criterios de éxito:**
- [ ] Proyecto corriendo en Docker
- [ ] Login funcionando con JWT
- [ ] Base de datos con migraciones
- [ ] Multi-tenancy básico

### **CHECKPOINT 2 - Semana 6**
**Criterios de éxito:**
- [ ] Datos del scraper llegando
- [ ] Extractor procesando noticias
- [ ] Queue system operativo
- [ ] Deduplicación funcionando

### **CHECKPOINT 3 - Semana 9**
**Criterios de éxito:**
- [ ] Análisis IA automático
- [ ] Costos bajo control
- [ ] API del dashboard lista
- [ ] Performance aceptable

### **CHECKPOINT 4 - Semana 12**
**Criterios de éxito:**
- [ ] Dashboard completo
- [ ] Alertas funcionando
- [ ] WebSockets estable
- [ ] MVP demo-able

### **CHECKPOINT 5 - Semana 16**
**Criterios de éxito:**
- [ ] Clustering operativo
- [ ] Detección de campañas
- [ ] Sistema optimizado
- [ ] Demo preparada

---

## RECURSOS POR FASE

### **FASE 1-2 (S1-S6):**
- 1 Full Stack Dev (100%)
- 1 Python Dev (50%)
- DevOps (20%)

### **FASE 3-4 (S7-S12):**
- 1 Full Stack Dev (100%)
- 1 Python Dev (30%)
- QA Tester (50%)

### **FASE 5 (S13-S16):**
- 1 Full Stack Dev (80%)
- QA Tester (100%)
- DevOps (30%)

---

## ENTREGABLES CLAVE POR MES

### **MES 1 (Semanas 1-4):**
- Sistema base con autenticación
- Integración con scraper Python
- Documentación técnica inicial

### **MES 2 (Semanas 5-8):**
- Procesamiento IA funcionando
- Dashboard API completa
- Extractor de noticias operativo

### **MES 3 (Semanas 9-12):**
- Dashboard UI en iPad
- Sistema de alertas completo
- MVP listo para testing

### **MES 4 (Semanas 13-16):**
- Features avanzados (clustering)
- Optimización y performance
- Demo pulida y estable

---

## PLAN DE CONTINGENCIA

### **Si hay retrasos en AUTH (crítico):**
- Reducir features de MFA para v2
- Usar auth básico temporal

### **Si IA es más costosa:**
- Reducir frecuencia de análisis
- Implementar cache más agresivo
- Considerar modelo más económico

### **Si clustering es muy complejo:**
- Lanzar MVP sin clustering
- Agregar en actualización post-demo

### **Si hay problemas de performance:**
- Optimizar queries prioritarias
- Agregar más cache
- Escalar verticalmente para demo

---

**NOTA:** Este Gantt asume 1 desarrollador full-time con apoyo parcial. Los tiempos pueden reducirse con más recursos o extenderse si hay impedimentos no previstos.