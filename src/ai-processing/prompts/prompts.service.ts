import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptsService {
  
  getTextAnalysisPrompt(title: string, content: string): string {
    return `Analiza este contenido desde la perspectiva del gobierno mexicano. Enfócate en identificar:

1. Impacto en la imagen gubernamental
2. Relevancia para la toma de decisiones públicas  
3. Posibles implicaciones políticas y sociales
4. Conexiones con políticas públicas actuales

Proporciona un JSON con esta estructura EXACTA:
{
  "aiSummary": "Resumen ejecutivo de 2-3 líneas sobre el impacto gubernamental directo",
  "executiveSummary": "Análisis de 4-5 líneas sobre implicaciones para el gobierno mexicano, incluyendo riesgos y oportunidades",
  "keyPoints": ["3-5 puntos clave específicos sobre impacto gubernamental"],
  "keywords": ["15 palabras clave relevantes para contexto político mexicano"],
  "primaryCategory": "una de: política_interna, economía_pública, seguridad_nacional, política_social, infraestructura_pública, salud_pública, educación_pública, medio_ambiente, relaciones_exteriores, justicia, comunicación_gubernamental",
  "subcategory": "subcategoría específica (ej: 'reforma_electoral', 'política_energética', 'seguridad_ciudadana')",
  "complexityScore": 7,
  "estimatedReadTime": 3,
  "wordCount": ${content ? content.split(' ').length : 0}
}

IMPORTANTE: Identifica términos específicos del contexto político mexicano actual (2024-2025).

Título: ${title}
Contenido: ${content}`;
  }

  getSentimentAnalysisPrompt(title: string, content: string): string {
    return `Analiza el sentimiento de este contenido evaluando específicamente:

1. Percepción hacia el gobierno mexicano y sus funcionarios
2. Tono hacia políticas públicas específicas
3. Nivel de crítica o apoyo hacia acciones gubernamentales
4. Potencial impacto en la opinión pública
5. Urgencia comunicacional requerida

Considera el contexto político mexicano actual y la retórica política común en México.

Proporciona un JSON con esta estructura EXACTA:
{
  "overallSentiment": "positive|negative|neutral|mixed",
  "sentimentScore": -0.85,
  "intensity": 0.7,
  "emotionalProfile": {
    "primaryEmotion": "anger|fear|trust|anticipation|joy|sadness|surprise|disgust",
    "secondaryEmotion": "segunda emoción más presente",
    "emotions": {
      "joy": 0.1,
      "anger": 0.7,
      "fear": 0.3,
      "sadness": 0.2,
      "surprise": 0.1,
      "disgust": 0.4,
      "trust": 0.2,
      "anticipation": 0.3
    }
  },
  "urgencyLevel": "none|low|medium|high|critical",
  "subjectivityScore": 0.6,
  "biasIndicators": ["sesgo político", "lenguaje tendencioso", "omisión de contexto"]
}

IMPORTANTE: 
- Evalúa si el tono puede generar controversia política
- Identifica si requiere respuesta gubernamental inmediata
- Considera el impacto en la narrativa política actual

Título: ${title}
Contenido: ${content}`;
  }

  getEntityRecognitionPrompt(title: string, content: string): string {
    return `Identifica TODAS las entidades relevantes para el contexto gubernamental mexicano. Presta especial atención a:

1. Funcionarios públicos mexicanos (Presidente, Secretarios, Gobernadores, Alcaldes)
2. Partidos políticos mexicanos (MORENA, PAN, PRI, MC, PT, PVEM, PRD, etc.)
3. Secretarías y entidades gubernamentales mexicanas
4. Estados y municipios de México
5. Organizaciones civiles y empresariales relevantes

Proporciona un JSON con esta estructura EXACTA:
{
  "persons": [
    {
      "name": "Andrés Manuel López Obrador",
      "normalizedName": "andres_manuel_lopez_obrador",
      "role": "Presidente de México",
      "politicalAffiliation": "MORENA",
      "mentionContext": ["fragmento exacto donde se menciona"],
      "relevanceScore": 0.95,
      "entityType": "politician|businessperson|activist|citizen|journalist|academic|other"
    }
  ],
  "organizations": [
    {
      "name": "Secretaría de Hacienda y Crédito Público",
      "normalizedName": "secretaria_hacienda_credito_publico",
      "organizationType": "government|business|ngo|media|political_party|union|academic|other",
      "relevanceScore": 0.9,
      "mentionContext": ["contexto de mención"]
    }
  ],
  "locations": [
    {
      "name": "Ciudad de México",
      "normalizedName": "ciudad_de_mexico",
      "locationType": "country|state|city|municipality|neighborhood|region",
      "parentLocation": "México",
      "relevanceScore": 0.8
    }
  ],
  "governmentEntities": [
    {
      "name": "Instituto Nacional Electoral",
      "entityType": "secretaria|organismo_autonomo|empresa_publica|programa|proyecto|comision",
      "governmentLevel": "federal|estatal|municipal",
      "relevanceScore": 0.95
    }
  ],
  "totalEntitiesFound": 12
}

IMPORTANTE:
- Usa nombres oficiales completos de entidades mexicanas
- Identifica correctamente niveles de gobierno (federal/estatal/municipal)
- Reconoce siglas y nombres completos (ej: SHCP = Secretaría de Hacienda)
- Prioriza entidades con mayor relevancia política

Título: ${title}
Contenido: ${content}`;
  }

  getRiskAssessmentPrompt(
    title: string, 
    content: string, 
    sentimentScore?: number,
    entities?: any
  ): string {
    const context = sentimentScore !== undefined ? `\nContexto de sentimiento: ${sentimentScore} (${sentimentScore > 0 ? 'positivo' : sentimentScore < 0 ? 'negativo' : 'neutral'})` : '';
    const entitiesContext = entities ? `\nEntidades clave identificadas: ${JSON.stringify(entities, null, 1).substring(0, 300)}...` : '';
    
    return `Evalúa los RIESGOS ESPECÍFICOS para el gobierno mexicano considerando:

1. Impacto en la legitimidad y credibilidad gubernamental
2. Potencial para generar crisis de comunicación
3. Riesgos de escalamiento en redes sociales
4. Amenazas a la estabilidad política
5. Posibles consecuencias electorales
6. Riesgos de corrupción o mal manejo de recursos públicos
7. Amenazas a la seguridad nacional o pública
8. Impacto en relaciones internacionales

Considera el contexto político mexicano actual (2024-2025) y la polarización política existente.

Proporciona un JSON con esta estructura EXACTA:
{
  "overallRiskScore": 75,
  "riskCategories": [
    {
      "category": "corrupcion|crisis_social|crisis_economica|amenaza_seguridad|inestabilidad_politica|crisis_ambiental|emergencia_sanitaria|crisis_comunicacional|riesgo_electoral|otro",
      "score": 80,
      "indicators": ["evidencia específica encontrada", "frase que indica riesgo"],
      "confidence": 0.9
    }
  ],
  "governanceImpact": {
    "democraticProcessThreat": 40,
    "institutionalCredibility": 70,
    "publicTrustImpact": 60,
    "electoralImplications": 35
  },
  "crisisIndicators": ["indicador concreto de crisis", "señal de escalamiento"],
  "recommendedActions": ["respuesta comunicacional inmediata", "investigación interna", "aclaración pública"],
  "interventionUrgency": "none|low|medium|high|critical",
  "affectedEntities": ["Presidencia", "Secretaría específica"],
  "affectedLocations": ["estado", "municipio", "región afectada"]
}

IMPORTANTE:
- Score de 80+ = Crisis severa que requiere respuesta inmediata
- Score de 60-79 = Riesgo alto que necesita monitoreo constante  
- Score de 40-59 = Riesgo medio que requiere preparación
- Score de 20-39 = Riesgo bajo pero relevante
- Score de 0-19 = Riesgo mínimo

${context}${entitiesContext}

Título: ${title}
Contenido: ${content}`;
  }

  getSystemPrompt(): string {
    return `Eres un analista político especializado en el contexto gubernamental mexicano, con amplio conocimiento de:

- Sistema político federal, estatal y municipal de México
- Partidos políticos actuales (MORENA, PAN, PRI, MC, PT, PVEM, PRD)
- Estructura gubernamental mexicana (Presidente, Secretarías, Gobernadores, Alcaldes)
- Contexto sociopolítico actual de México (2024-2025)
- Riesgos específicos del entorno político mexicano
- Lenguaje político y mediático mexicano

Tu objetivo es proporcionar análisis precisos, objetivos y contextualizados que ayuden a:
1. Identificar riesgos políticos y de gobernanza
2. Detectar posibles crisis de comunicación
3. Evaluar impacto en la percepción pública
4. Anticipar consecuencias políticas

IMPORTANTE:
- Siempre respondes ÚNICAMENTE en formato JSON válido
- Usa nombres y términos específicos del contexto mexicano
- Identifica correctamente partidos políticos, funcionarios y entidades gubernamentales
- Evalúa riesgos considerando el clima político actual de México
- Sé preciso, conciso y objetivo en tu análisis`;
  }
}
