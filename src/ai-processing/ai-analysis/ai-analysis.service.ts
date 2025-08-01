import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { PromptsService } from '../prompts/prompts.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import OpenAI from 'openai';
import * as crypto from 'crypto';

export interface TextAnalysisResult {
  aiSummary: string;
  executiveSummary: string;
  keyPoints: string[];
  keywords: string[];
  primaryCategory: string;
  subcategory: string;
  complexityScore: number;
  estimatedReadTime: number;
  wordCount: number;
}

export interface SentimentAnalysisResult {
  overallSentiment: string;
  sentimentScore: number;
  intensity: number;
  emotionalProfile: {
    primaryEmotion: string;
    secondaryEmotion?: string;
    emotions: Record<string, number>;
  };
  urgencyLevel: string;
  subjectivityScore: number;
  biasIndicators: string[];
}

export interface EntityRecognitionResult {
  persons: Array<{
    name: string;
    normalizedName: string;
    role: string;
    politicalAffiliation?: string;
    mentionContext: string[];
    relevanceScore: number;
    entityType: string;
  }>;
  organizations: Array<{
    name: string;
    normalizedName: string;
    organizationType: string;
    relevanceScore: number;
    mentionContext: string[];
  }>;
  locations: Array<{
    name: string;
    normalizedName: string;
    locationType: string;
    parentLocation?: string;
    relevanceScore: number;
  }>;
  governmentEntities: Array<{
    name: string;
    entityType: string;
    governmentLevel: string;
    relevanceScore: number;
  }>;
  totalEntitiesFound: number;
}

export interface RiskAssessmentResult {
  overallRiskScore: number;
  riskCategories: Array<{
    category: string;
    score: number;
    indicators: string[];
    confidence: number;
  }>;
  governanceImpact: {
    democraticProcessThreat: number;
    institutionalCredibility: number;
    publicTrustImpact: number;
    electoralImplications: number;
  };
  crisisIndicators: string[];
  recommendedActions: string[];
  interventionUrgency: string;
  affectedEntities: string[];
  affectedLocations: string[];
}

export interface AnalysisResult<T> {
  analysis: T;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface CompleteAnalysisResult {
  id: string;
  textAnalysis: TextAnalysisResult;
  sentimentAnalysis: SentimentAnalysisResult;
  entityRecognition: EntityRecognitionResult;
  riskAssessment: RiskAssessmentResult;
  processingTime: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  analysisDate: string;
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private openai: OpenAI;
  
  // Precios actuales de OpenAI para gpt-4o-mini (por 1K tokens)
  private readonly INPUT_TOKEN_COST = 0.00015; // $0.00015 per 1K input tokens
  private readonly OUTPUT_TOKEN_COST = 0.0006; // $0.0006 per 1K output tokens

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly promptsService: PromptsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async performCompleteAnalysis(
    contentId: string,
    contentType: 'tweet' | 'news',
    title: string,
    content: string,
    tenantId: string
  ): Promise<CompleteAnalysisResult> {
    const startTime = Date.now();
    const analysisId = crypto.randomUUID();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    try {
      this.logger.log(`Starting complete analysis for ${contentType} ${contentId}`);

      // Realizar los 4 análisis en paralelo para optimizar tiempo
      const [textResult, sentimentResult, entityResult] = await Promise.all([
        this.performTextAnalysis(title, content),
        this.performSentimentAnalysis(title, content),
        this.performEntityRecognition(title, content)
      ]);

      // Acumular tokens de los primeros 3 análisis
      totalInputTokens += textResult.inputTokens + sentimentResult.inputTokens + entityResult.inputTokens;
      totalOutputTokens += textResult.outputTokens + sentimentResult.outputTokens + entityResult.outputTokens;

      // Risk assessment con contexto de sentiment y entities
      const riskResult = await this.performRiskAssessment(
        title, 
        content, 
        sentimentResult.analysis.sentimentScore,
        entityResult.analysis
      );

      // Acumular tokens del risk assessment
      totalInputTokens += riskResult.inputTokens;
      totalOutputTokens += riskResult.outputTokens;

      const processingTime = Date.now() - startTime;
      const totalCost = this.calculateRealCost(totalInputTokens, totalOutputTokens);

      // Guardar resultados en base de datos
      await this.saveAnalysisResults({
        id: analysisId,
        tenantId,
        contentId,
        contentType,
        textAnalysis: textResult.analysis,
        sentimentAnalysis: sentimentResult.analysis,
        entityRecognition: entityResult.analysis,
        riskAssessment: riskResult.analysis,
        processingTime,
        totalCost,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens
      });

      // Generar alertas si es necesario
      await this.generateAlertsIfNeeded(analysisId, tenantId, riskResult.analysis, sentimentResult.analysis);

      // Log de auditoría
      await this.auditService.logAction(
        tenantId,
        null, // Sistema
        AuditAction.DATA_ACCESSED,
        AuditEntityType.AI_ANALYSIS,
        analysisId,
        null,
        {
          contentType,
          contentId,
          processingTime,
          totalCost,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          riskScore: riskResult.analysis.overallRiskScore,
          urgencyLevel: riskResult.analysis.interventionUrgency
        },
        { source: 'ai-analysis', analysisTypes: 4 }
      );

      this.logger.log(`Complete analysis finished for ${contentId} in ${processingTime}ms - Cost: $${totalCost.toFixed(6)}`);

      return {
        id: analysisId,
        textAnalysis: textResult.analysis,
        sentimentAnalysis: sentimentResult.analysis,
        entityRecognition: entityResult.analysis,
        riskAssessment: riskResult.analysis,
        processingTime,
        totalCost,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        analysisDate: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to complete analysis for ${contentId}:`, error);
      throw new BadRequestException(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performTextAnalysis(title: string, content: string): Promise<AnalysisResult<TextAnalysisResult>> {
    const prompt = this.promptsService.getTextAnalysisPrompt(title, content);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.promptsService.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }
    
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cost = this.calculateRealCost(inputTokens, outputTokens);
    
    const analysis = JSON.parse(responseContent) as TextAnalysisResult;
    
    return {
      analysis,
      inputTokens,
      outputTokens,
      cost
    };
  }

  async performSentimentAnalysis(title: string, content: string): Promise<AnalysisResult<SentimentAnalysisResult>> {
    const prompt = this.promptsService.getSentimentAnalysisPrompt(title, content);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.promptsService.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }
    
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cost = this.calculateRealCost(inputTokens, outputTokens);
    
    const analysis = JSON.parse(responseContent) as SentimentAnalysisResult;
    
    return {
      analysis,
      inputTokens,
      outputTokens,
      cost
    };
  }

  async performEntityRecognition(title: string, content: string): Promise<AnalysisResult<EntityRecognitionResult>> {
    const prompt = this.promptsService.getEntityRecognitionPrompt(title, content);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.promptsService.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }
    
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cost = this.calculateRealCost(inputTokens, outputTokens);
    
    const analysis = JSON.parse(responseContent) as EntityRecognitionResult;
    
    return {
      analysis,
      inputTokens,
      outputTokens,
      cost
    };
  }

  async performRiskAssessment(
    title: string, 
    content: string, 
    sentimentScore?: number,
    entities?: EntityRecognitionResult
  ): Promise<AnalysisResult<RiskAssessmentResult>> {
    const prompt = this.promptsService.getRiskAssessmentPrompt(title, content, sentimentScore, entities);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.promptsService.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }
    
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cost = this.calculateRealCost(inputTokens, outputTokens);
    
    const analysis = JSON.parse(responseContent) as RiskAssessmentResult;
    
    return {
      analysis,
      inputTokens,
      outputTokens,
      cost
    };
  }

  private calculateRealCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.INPUT_TOKEN_COST;
    const outputCost = (outputTokens / 1000) * this.OUTPUT_TOKEN_COST;
    return Number((inputCost + outputCost).toFixed(6));
  }

  private async saveAnalysisResults(data: {
    id: string;
    tenantId: string;
    contentId: string;
    contentType: 'tweet' | 'news';
    textAnalysis: TextAnalysisResult;
    sentimentAnalysis: SentimentAnalysisResult;
    entityRecognition: EntityRecognitionResult;
    riskAssessment: RiskAssessmentResult;
    processingTime: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  }): Promise<void> {
    // Guardar análisis completo con estructura optimizada
    await this.prisma.aiAnalysis.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        tweetId: data.contentType === 'tweet' ? data.contentId : null,
        newsId: data.contentType === 'news' ? data.contentId : null,
        type: data.contentType === 'tweet' ? 'TWEET_ANALYSIS' : 'NEWS_ANALYSIS',
        prompt: 'AI Complete Analysis (4 types)',
        response: JSON.parse(JSON.stringify({
          textAnalysis: data.textAnalysis,
          sentimentAnalysis: data.sentimentAnalysis,
          entityRecognition: data.entityRecognition,
          riskAssessment: data.riskAssessment,
          processingTime: data.processingTime,
          totalCost: data.totalCost,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
        })),
        sentiment: data.sentimentAnalysis.overallSentiment,
        relevance: data.riskAssessment.overallRiskScore / 100,
        threatLevel: data.riskAssessment.overallRiskScore > 70 ? 'HIGH' : 
                    data.riskAssessment.overallRiskScore > 40 ? 'MEDIUM' : 'LOW',
        tags: data.textAnalysis.keywords,
        createdAt: new Date(),
      }
    });
  }

  private async generateAlertsIfNeeded(
    analysisId: string,
    tenantId: string,
    riskAssessment: RiskAssessmentResult,
    sentimentAnalysis: SentimentAnalysisResult
  ): Promise<void> {
    const alerts = [];

    // Alerta por alto riesgo
    if (riskAssessment.overallRiskScore > 70) {
      alerts.push({
        type: 'THREAT_DETECTED',
        severity: riskAssessment.overallRiskScore >= 80 ? 'CRITICAL' : 'WARNING',
        title: 'Contenido de Alto Riesgo Detectado',
        description: `Risk Score: ${riskAssessment.overallRiskScore}/100. Urgencia: ${riskAssessment.interventionUrgency}`,
        metadata: { riskScore: riskAssessment.overallRiskScore, analysisId }
      });
    }

    // Alerta por sentimiento muy negativo
    if (sentimentAnalysis.sentimentScore < -0.7 && sentimentAnalysis.intensity > 0.8) {
      alerts.push({
        type: 'SENTIMENT_CHANGE',
        severity: 'WARNING',
        title: 'Sentimiento Muy Negativo Detectado',
        description: `Sentiment: ${sentimentAnalysis.sentimentScore} con intensidad ${sentimentAnalysis.intensity}`,
        metadata: { sentimentScore: sentimentAnalysis.sentimentScore, analysisId }
      });
    }

    // Alerta por urgencia crítica
    if (riskAssessment.interventionUrgency === 'critical') {
      alerts.push({
        type: 'THREAT_DETECTED',
        severity: 'CRITICAL',
        title: 'Intervención Crítica Requerida',
        description: `Situación crítica detectada. Acciones recomendadas: ${riskAssessment.recommendedActions.join(', ')}`,
        metadata: { urgencyLevel: 'critical', analysisId }
      });
    }

    // Crear alertas en base de datos
    for (const alert of alerts) {
      await this.prisma.alert.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          type: alert.type as any,
          severity: alert.severity as any,
          title: alert.title,
          message: alert.description,
          metadata: JSON.parse(JSON.stringify(alert.metadata)),
          status: 'UNREAD',
          createdAt: new Date(),
        }
      });
    }

    if (alerts.length > 0) {
      this.logger.warn(`Generated ${alerts.length} alerts for analysis ${analysisId}`);
    }
  }
}
