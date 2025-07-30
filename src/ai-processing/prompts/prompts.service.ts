import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptsService {
  
  getTextAnalysisPrompt(title: string, content: string): string {
    return `Eres un analista político experto en comunicación gubernamental mexicana.
Analiza el siguiente artículo y proporciona un JSON con la siguiente estructura exacta:
{
  "aiSummary": "Resumen ejecutivo de 2-3 líneas enfocado en impacto gubernamental",
  "executiveSummary": "Análisis profundo de 3-5 líneas sobre implicaciones políticas",
  "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
  "keywords": ["palabra1", "palabra2", "palabra3", "...hasta 15"],
  "primaryCategory": "una de: política, economía, seguridad, social, infraestructura, salud, educación, medio_ambiente, otros",
  "subcategory": "subcategoría específica",
  "complexityScore": 7,
  "estimatedReadTime": 3,
  "wordCount": 450
}

Artículo a analizar:
Título: ${title}
Contenido: ${content}`;
  }

  getSentimentAnalysisPrompt(title: string, content: string): string {
    return `Analiza el sentimiento y tono emocional del siguiente artículo desde la perspectiva de percepción gubernamental.
Proporciona un JSON con la siguiente estructura exacta:
{
  "overallSentiment": "positive" o "negative" o "neutral" o "mixed",
  "sentimentScore": -0.5,
  "intensity": 0.7,
  "emotionalProfile": {
    "primaryEmotion": "una de: joy, anger, fear, sadness, surprise, disgust, trust, anticipation",
    "secondaryEmotion": "opcional: otra emoción",
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
  "urgencyLevel": "low" o "medium" o "high" o "critical",
  "subjectivityScore": 0.6,
  "biasIndicators": ["indicador1", "indicador2"]
}

Artículo:
Título: ${title}
Contenido: ${content}`;
  }

  getEntityRecognitionPrompt(title: string, content: string): string {
    return `Identifica todas las entidades políticas y gubernamentales relevantes en el artículo.
Proporciona un JSON con la siguiente estructura exacta:
{
  "persons": [
    {
      "name": "Nombre Completo",
      "normalizedName": "nombre_completo",
      "role": "cargo o rol",
      "politicalAffiliation": "partido si se menciona",
      "mentionContext": ["frase donde aparece"],
      "relevanceScore": 0.8,
      "entityType": "politician" o "businessperson" o "activist" o "citizen" o "other"
    }
  ],
  "organizations": [
    {
      "name": "Nombre Organización",
      "normalizedName": "nombre_organizacion",
      "organizationType": "government" o "business" o "ngo" o "media" o "political_party" o "other",
      "relevanceScore": 0.7,
      "mentionContext": ["contexto de mención"]
    }
  ],
  "locations": [
    {
      "name": "Nombre Lugar",
      "normalizedName": "nombre_lugar",
      "locationType": "country" o "state" o "city" o "municipality" o "neighborhood",
      "parentLocation": "ubicación padre si aplica",
      "relevanceScore": 0.6
    }
  ],
  "governmentEntities": [
    {
      "name": "Entidad Gubernamental",
      "entityType": "ministry" o "agency" o "program" o "project",
      "governmentLevel": "federal" o "state" o "municipal",
      "relevanceScore": 0.9
    }
  ],
  "totalEntitiesFound": 15
}

Artículo:
Título: ${title}
Contenido: ${content}`;
  }

  getRiskAssessmentPrompt(
    title: string, 
    content: string, 
    sentimentScore?: number,
    entities?: any
  ): string {
    const context = sentimentScore !== undefined ? `\nSentimiento detectado: ${sentimentScore}` : '';
    const entitiesContext = entities ? `\nEntidades identificadas: ${JSON.stringify(entities).substring(0, 200)}...` : '';
    
    return `Evalúa los riesgos gubernamentales y políticos presentes en el artículo.
Proporciona un JSON con la siguiente estructura exacta:
{
  "overallRiskScore": 45,
  "riskCategories": [
    {
      "category": "corruption" o "social_unrest" o "economic_crisis" o "security_threat" o "political_instability" o "environmental_crisis" o "health_emergency" o "other",
      "score": 60,
      "indicators": ["frase1", "palabra clave"],
      "confidence": 0.8
    }
  ],
  "governanceImpact": {
    "democraticProcessThreat": 30,
    "institutionalCredibility": 45,
    "publicTrustImpact": 50,
    "electoralImplications": 20
  },
  "crisisIndicators": ["señal de crisis 1", "señal 2"],
  "recommendedActions": ["acción recomendada 1", "acción 2"],
  "interventionUrgency": "none" o "low" o "medium" o "high" o "critical",
  "affectedEntities": ["entidad gubernamental 1", "entidad 2"],
  "affectedLocations": ["lugar 1", "lugar 2"]
}
${context}${entitiesContext}

Artículo:
Título: ${title}
Contenido: ${content}`;
  }

  getSystemPrompt(): string {
    return `Eres un analista político experto del gobierno mexicano. 
Tu objetivo es proporcionar análisis precisos y objetivos que ayuden a la toma de decisiones gubernamentales.
Siempre respondes en formato JSON válido y estructurado.
Enfócate en información relevante para el contexto político y gubernamental mexicano.
Sé conciso pero completo en tu análisis.`;
  }
}
