# USER STORIES - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Versión:** v1.0  
**Total User Stories:** 91

## MODELO DE NEGOCIO MULTI-SEGMENTO

### SEGMENTOS DE MERCADO:
1. **GUBERNAMENTAL ESTATAL** - Aislamiento total
2. **GUBERNAMENTAL MUNICIPAL** - Aislamiento total  
3. **ALTO PERFIL INDIVIDUAL** - Aislamiento total

### ROLES UNIFICADOS:
1. **LÍDER** (Gobernador/Presidente Municipal/Diputado/Senador)
2. **DIRECTOR COMUNICACIÓN**
3. **DIRECTOR ÁREA** (solo gubernamentales)
4. **ASISTENTE**

---

## USER STORIES - DIRECTOR DE COMUNICACIÓN SOCIAL
*Total: 33 User Stories*

### ÉPICA 1: Gestión de Usuarios
- **US-D001**: Como Director, quiero dar de alta nuevos usuarios para expandir mi equipo
- **US-D002**: Como Director, quiero dar de baja usuarios temporalmente sin eliminar sus datos
- **US-D003**: Como Director, quiero eliminar usuarios permanentemente del sistema
- **US-D004**: Como Director, quiero configurar la cuenta principal de cada usuario (permisos, roles, jerarquía)

### ÉPICA 2: Dashboard y Monitoreo de Noticias
- **US-D005**: Como Director, quiero ver un dashboard en tiempo real de mi estado
- **US-D006**: Como Director, quiero ver noticias de medios de MI ENTIDAD específica y medios nacionales
- **US-D007**: Como Director, quiero filtrar noticias por autor, medio, tag, categoría, sentimiento
- **US-D008**: Como Director, quiero configurar y eliminar personas de interés y temas de interés personalizados
- **US-D009**: Como Director, quiero ver riesgos de análisis potenciales
- **US-D010**: Como Director, quiero ver análisis comparativo contra otros estados
- **US-D011**: Como Director, quiero acceder a columnas de opinión por autor o medio de comunicación
- **US-D012**: Como Director, quiero clasificar autores según su identidad política basada en sus redacciones

### ÉPICA 3: Inteligencia Artificial y Análisis
- **US-D013**: Como Director, quiero ver resúmenes de noticias procesados por IA
- **US-D014**: Como Director, quiero ver análisis de sentimiento y clasificación de riesgo potencial por IA
- **US-D015**: Como Director, quiero ver tendencias de palabras clave analizadas por IA
- **US-D016**: Como Director, quiero que las columnas de opinión se procesen automáticamente

### ÉPICA 4: Sistema de Alertas y Monitoreo
- **US-D017**: Como Director, quiero configurar monitores de temas que podrían escalar
- **US-D018**: Como Director, quiero recibir alertas por socket en tiempo real
- **US-D019**: Como Director, quiero recibir notificaciones push mediante Expo
- **US-D020**: Como Director, quiero configurar alertas para medios nacionales sobre mi entidad
- **US-D021**: Como Director, quiero configurar temas de interés que generen alertas automáticas a otros usuarios

### ÉPICA 5: Síntesis y Reportes Automatizados
- **US-D022**: Como Director, quiero programar análisis de períodos específicos por tópico (procesado por IA)
- **US-D023**: Como Director, quiero programar investigaciones sobre personajes políticos
- **US-D024**: Como Director, quiero generar reportes automáticos exportables
- **US-D025**: Como Director, quiero recibir síntesis informativa cada 2 horas de medios estatales
- **US-D026**: Como Director, quiero recibir síntesis diaria a las 7am del día anterior procesada por IA

### ÉPICA 6: Sistema de Comunicación
- **US-D027**: Como Director, quiero iniciar chats con usuarios de igual o menor jerarquía
- **US-D028**: Como Director, quiero que los chats tengan encriptación E2E
- **US-D029**: Como Director, quiero iniciar chats desde cualquier elemento (nota, tag, alerta, tema) con contexto automático
- **US-D030**: Como Director, quiero generar comunicados de prensa
- **US-D031**: Como Director, quiero enviar comunicados por correo electrónico

### ÉPICA 7: Gestión Personal y Soporte
- **US-D032**: Como Director, quiero solicitar asistencia técnica total mediante la plataforma
- **US-D033**: Como Director, quiero actualizar mi perfil personal

---

## USER STORIES - LÍDER (Gobernador/Presidente Municipal)
*Total: 21 User Stories*

### ÉPICA 1: ❌ SIN GESTIÓN DE USUARIOS
- **NO TIENE**: Gestión completa de usuarios (altas, bajas, eliminación, configuración)

### ÉPICA 2: Dashboard y Monitoreo de Noticias
- **US-L001**: Como Líder, quiero ver un dashboard en tiempo real de mi entidad
- **US-L002**: Como Líder, quiero ver noticias de medios de MI ENTIDAD específica y medios nacionales
- **US-L003**: Como Líder, quiero filtrar noticias por autor, medio, tag, categoría, sentimiento
- **US-L004**: Como Líder, quiero configurar y eliminar personas de interés y temas de interés personalizados
- **US-L005**: Como Líder, quiero ver riesgos de análisis potenciales
- **US-L006**: Como Líder, quiero ver análisis comparativo contra otras entidades
- **US-L007**: Como Líder, quiero acceder a columnas de opinión por autor o medio de comunicación
- **US-L008**: Como Líder, quiero clasificar autores según su identidad política basada en sus redacciones

### ÉPICA 3: Inteligencia Artificial y Análisis
- **US-L009**: Como Líder, quiero ver resúmenes de noticias procesados por IA
- **US-L010**: Como Líder, quiero ver análisis de sentimiento y clasificación de riesgo potencial por IA
- **US-L011**: Como Líder, quiero ver tendencias de palabras clave analizadas por IA
- **US-L012**: Como Líder, quiero que las columnas de opinión se procesen automáticamente

### ÉPICA 4: ⚠️ Sistema de Alertas LIMITADO
- **US-L013**: Como Líder, quiero recibir alertas por socket en tiempo real
- **US-L014**: Como Líder, quiero recibir notificaciones push mediante Expo
- **❌ NO TIENE**: Configurar alertas nacionales
- **❌ NO TIENE**: Configurar temas de interés que generen alertas a otros usuarios
- **❌ NO TIENE**: Configurar monitores de temas que podrían escalar

### ÉPICA 5: ⚠️ Reportes LIMITADOS
- **US-L015**: Como Líder, quiero ver reportes al final del día (NO cada 2 horas)
- **US-L016**: Como Líder, quiero recibir síntesis diaria a las 7am del día anterior procesada por IA
- **❌ NO TIENE**: Generar reportes automáticos exportables
- **❌ NO TIENE**: Programar análisis (la IA lo hace automáticamente)

### ÉPICA 6: ⚠️ Sistema de Comunicación RESTRINGIDO
- **US-L017**: Como Líder, quiero iniciar chats SOLO con: Directores de Área y Director de Comunicación Social
- **US-L018**: Como Líder, quiero que los chats tengan encriptación E2E
- **US-L019**: Como Líder, quiero iniciar chats desde cualquier elemento (nota, tag, alerta, tema) con contexto automático
- **❌ NO TIENE**: Generar comunicados de prensa
- **❌ NO TIENE**: Enviar comunicados por correo electrónico

### ÉPICA 7: Gestión Personal y Soporte
- **US-L020**: Como Líder, quiero solicitar asistencia técnica total mediante la plataforma
- **US-L021**: Como Líder, quiero actualizar mi perfil personal

---

## USER STORIES - DIRECTOR DE ÁREA (Secretario/Director)
*Total: 21 User Stories*

### ÉPICA 1: ❌ SIN GESTIÓN DE USUARIOS
- **NO TIENE**: Gestión completa de usuarios (altas, bajas, eliminación, configuración)

### ÉPICA 2: Dashboard y Monitoreo de Noticias
- **US-DA001**: Como Director de Área, quiero ver un dashboard en tiempo real de mi entidad
- **US-DA002**: Como Director de Área, quiero ver noticias de medios de MI ENTIDAD específica y medios nacionales
- **US-DA003**: Como Director de Área, quiero filtrar noticias por autor, medio, tag, categoría, sentimiento
- **US-DA004**: Como Director de Área, quiero configurar y eliminar personas de interés y temas de interés personalizados
- **US-DA005**: Como Director de Área, quiero ver riesgos de análisis potenciales
- **US-DA006**: Como Director de Área, quiero ver análisis comparativo contra otras entidades
- **US-DA007**: Como Director de Área, quiero acceder a columnas de opinión por autor o medio de comunicación
- **US-DA008**: Como Director de Área, quiero clasificar autores según su identidad política basada en sus redacciones

### ÉPICA 3: Inteligencia Artificial y Análisis
- **US-DA009**: Como Director de Área, quiero ver resúmenes de noticias procesados por IA
- **US-DA010**: Como Director de Área, quiero ver análisis de sentimiento y clasificación de riesgo potencial por IA
- **US-DA011**: Como Director de Área, quiero ver tendencias de palabras clave analizadas por IA
- **US-DA012**: Como Director de Área, quiero que las columnas de opinión se procesen automáticamente

### ÉPICA 4: ⚠️ Sistema de Alertas LIMITADO
- **US-DA013**: Como Director de Área, quiero recibir alertas por socket en tiempo real
- **US-DA014**: Como Director de Área, quiero recibir notificaciones push mediante Expo
- **❌ NO TIENE**: Configurar alertas nacionales
- **❌ NO TIENE**: Configurar temas de interés que generen alertas a otros usuarios
- **❌ NO TIENE**: Configurar monitores de temas que podrían escalar

### ÉPICA 5: ⚠️ Reportes LIMITADOS
- **US-DA015**: Como Director de Área, quiero ver reportes al final del día (NO cada 2 horas)
- **US-DA016**: Como Director de Área, quiero recibir síntesis diaria a las 7am del día anterior procesada por IA
- **❌ NO TIENE**: Generar reportes automáticos exportables
- **❌ NO TIENE**: Programar análisis (la IA lo hace automáticamente)

### ÉPICA 6: ⚠️ Sistema de Comunicación RESTRINGIDO
- **US-DA017**: Como Director de Área, quiero iniciar chats SOLO con: Líder, Director de Comunicación Social y mi Asistente
- **US-DA018**: Como Director de Área, quiero que los chats tengan encriptación E2E
- **US-DA019**: Como Director de Área, quiero iniciar chats desde cualquier elemento (nota, tag, alerta, tema) con contexto automático
- **❌ NO TIENE**: Generar comunicados de prensa
- **❌ NO TIENE**: Enviar comunicados por correo electrónico

### ÉPICA 7: Gestión Personal y Soporte
- **US-DA020**: Como Director de Área, quiero solicitar asistencia técnica total mediante la plataforma
- **US-DA021**: Como Director de Área, quiero actualizar mi perfil personal

---

## USER STORIES - ASISTENTE
*Total: 16 User Stories*

### ÉPICA 1: ❌ SIN GESTIÓN DE USUARIOS
- **NO TIENE**: Gestión de usuarios

### ÉPICA 2: Dashboard y Monitoreo SIMPLIFICADO
- **US-A001**: Como Asistente, quiero ver un dashboard simplificado en tiempo real de mi entidad
- **US-A002**: Como Asistente, quiero ver noticias de medios de MI ENTIDAD específica y medios nacionales
- **US-A003**: Como Asistente, quiero filtrar noticias por autor, medio, tag, categoría, sentimiento
- **US-A004**: Como Asistente, quiero ver personas de interés y temas de interés (configurados por superiores)
- **US-A005**: Como Asistente, quiero ver riesgos de análisis potenciales
- **US-A006**: Como Asistente, quiero ver análisis comparativo contra otras entidades
- **US-A007**: Como Asistente, quiero acceder a columnas de opinión por autor o medio de comunicación
- **US-A008**: Como Asistente, quiero clasificar autores según su identidad política basada en sus redacciones

### ÉPICA 3: Inteligencia Artificial y Análisis
- **US-A009**: Como Asistente, quiero ver resúmenes de noticias procesados por IA
- **US-A010**: Como Asistente, quiero ver análisis de sentimiento y clasificación de riesgo potencial por IA
- **US-A011**: Como Asistente, quiero ver tendencias de palabras clave analizadas por IA
- **US-A012**: Como Asistente, quiero que las columnas de opinión se procesen automáticamente

### ÉPICA 4: ⚠️ Sistema de Alertas SOLO RECEPCIÓN
- **US-A013**: Como Asistente, quiero recibir alertas por socket configuradas por mi superior directo
- **US-A014**: Como Asistente, quiero recibir notificaciones push mediante Expo
- **US-A015**: Como Asistente, quiero recibir alertas de temas generales configurados por el Director de Comunicación
- **❌ NO PUEDE**: Configurar alertas propias

### ÉPICA 5: ⚠️ Reportes RESTRINGIDOS
- **US-A016**: Como Asistente, quiero generar reportes SOLO de lo configurado por mi superior
- **US-A017**: Como Asistente, quiero recibir síntesis diaria a las 7am del día anterior procesada por IA
- **US-A018**: Como Asistente, quiero ver reportes al final del día (NO cada 2 horas)

### ÉPICA 6: ⚠️ Sistema de Comunicación MUY RESTRINGIDO
- **US-A019**: Como Asistente, NO PUEDO iniciar conversaciones con nadie
- **US-A020**: Como Asistente, quiero responder chats iniciados por mi superior directo
- **US-A021**: Como Asistente, quiero que los chats tengan encriptación E2E
- **US-A022**: Como Asistente, quiero responder chats desde cualquier elemento (nota, tag, alerta, tema) con contexto automático
- **❌ NO TIENE**: Generar comunicados de prensa
- **❌ NO TIENE**: Enviar comunicados por correo electrónico

### ÉPICA 7: Gestión Personal y Soporte
- **US-A023**: Como Asistente, quiero solicitar asistencia técnica total mediante la plataforma
- **US-A024**: Como Asistente, quiero actualizar mi perfil personal

---

## REGLAS DE COMUNICACIÓN JERÁRQUICA

### DIRECTOR COMUNICACIÓN:
- ✅ Puede iniciar chat con **TODOS** los usuarios de igual o menor jerarquía

### LÍDER (Gobernador/Presidente):
- ✅ Puede iniciar chat con: **Director Comunicación** y **Directores de Área**
- ❌ NO puede con: **Asistentes**

### DIRECTOR DE ÁREA (Secretario/Director):
- ✅ Puede iniciar chat con: **Líder**, **Director Comunicación** y **su Asistente**
- ❌ NO puede con: **Otros Directores** o **Asistentes de otros**

### ASISTENTE:
- ❌ **NO PUEDE** iniciar conversaciones con nadie
- ✅ Solo **responde** chats iniciados por su superior directo

---

## ARQUITECTURA MULTI-TENANT

### AISLAMIENTO TOTAL:
- **TENANT_ESTATAL_XXX** (Por cada estado)
- **TENANT_MUNICIPAL_XXX** (Por cada municipio)  
- **TENANT_INDIVIDUAL_XXX** (Por cada político de alto perfil)

### SEGMENTO INDIVIDUAL:
- **Cliente Principal** = Permisos de Director Comunicación
- **Su Asistente** = Permisos de Asistente
- **Chat SOLO entre ellos dos**

---

**Notas:**
- Total de 91 User Stories identificadas
- Sistema multi-tenant con aislamiento completo
- Arquitectura escalable para 3 segmentos de mercado
- Chat jerárquico con encriptación E2E
- Procesamiento IA con GPT-4 mini para optimización de costos