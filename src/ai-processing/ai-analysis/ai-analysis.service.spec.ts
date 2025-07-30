import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiAnalysisService } from './ai-analysis.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { PromptsService } from '../prompts/prompts.service';

// Mock OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let promptsService: PromptsService;
  let configService: ConfigService;

  const mockOpenAIResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          aiSummary: "Test summary",
          executiveSummary: "Test executive summary",
          keyPoints: ["Point 1", "Point 2"],
          keywords: ["keyword1", "keyword2"],
          primaryCategory: "política_interna",
          subcategory: "test_subcategory",
          complexityScore: 7,
          estimatedReadTime: 3,
          wordCount: 100
        })
      }
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  };

  const mockPrismaService = {
    aiAnalysis: {
      create: jest.fn(),
    },
    alert: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  const mockPromptsService = {
    getSystemPrompt: jest.fn().mockReturnValue('System prompt'),
    getTextAnalysisPrompt: jest.fn().mockReturnValue('Text analysis prompt'),
    getSentimentAnalysisPrompt: jest.fn().mockReturnValue('Sentiment analysis prompt'),
    getEntityRecognitionPrompt: jest.fn().mockReturnValue('Entity recognition prompt'),
    getRiskAssessmentPrompt: jest.fn().mockReturnValue('Risk assessment prompt'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalysisService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: PromptsService,
          useValue: mockPromptsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiAnalysisService>(AiAnalysisService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    promptsService = module.get<PromptsService>(PromptsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('performTextAnalysis', () => {
    it('should perform text analysis and return structured result', async () => {
      // Mock OpenAI response
      const mockOpenAI = service['openai'];
      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await service.performTextAnalysis('Test Title', 'Test Content');

      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('inputTokens', 100);
      expect(result).toHaveProperty('outputTokens', 50);
      expect(result).toHaveProperty('cost');
      expect(result.analysis).toHaveProperty('aiSummary', 'Test summary');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: expect.any(Array),
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
    });

    it('should throw error when OpenAI returns no content', async () => {
      const mockOpenAI = service['openai'];
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
        usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 }
      });

      await expect(
        service.performTextAnalysis('Test Title', 'Test Content')
      ).rejects.toThrow('No content received from OpenAI');
    });
  });

  describe('performSentimentAnalysis', () => {
    it('should perform sentiment analysis and return structured result', async () => {
      const sentimentResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overallSentiment: "negative",
              sentimentScore: -0.7,
              intensity: 0.8,
              emotionalProfile: {
                primaryEmotion: "anger",
                secondaryEmotion: "fear",
                emotions: {
                  anger: 0.7,
                  fear: 0.3,
                  joy: 0.1,
                  sadness: 0.2,
                  surprise: 0.1,
                  disgust: 0.4,
                  trust: 0.2,
                  anticipation: 0.3
                }
              },
              urgencyLevel: "high",
              subjectivityScore: 0.6,
              biasIndicators: ["political bias"]
            })
          }
        }],
        usage: { prompt_tokens: 120, completion_tokens: 80, total_tokens: 200 }
      };

      const mockOpenAI = service['openai'];
      mockOpenAI.chat.completions.create.mockResolvedValue(sentimentResponse);

      const result = await service.performSentimentAnalysis('Test Title', 'Test Content');

      expect(result.analysis).toHaveProperty('overallSentiment', 'negative');
      expect(result.analysis).toHaveProperty('sentimentScore', -0.7);
      expect(result.analysis).toHaveProperty('urgencyLevel', 'high');
      expect(result.inputTokens).toBe(120);
      expect(result.outputTokens).toBe(80);
    });
  });

  describe('performCompleteAnalysis', () => {
    it('should perform complete analysis with all 4 types', async () => {
      // Mock all OpenAI calls
      const mockOpenAI = service['openai'];
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockOpenAIResponse) // Text analysis
        .mockResolvedValueOnce(mockOpenAIResponse) // Sentiment analysis  
        .mockResolvedValueOnce(mockOpenAIResponse) // Entity recognition
        .mockResolvedValueOnce(mockOpenAIResponse); // Risk assessment

      mockPrismaService.aiAnalysis.create.mockResolvedValue({
        id: 'test-analysis-id',
        createdAt: new Date(),
      });

      const result = await service.performCompleteAnalysis(
        'tweet-123',
        'tweet',
        'Test Title',
        'Test Content',
        'test-tenant-id'
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('textAnalysis');
      expect(result).toHaveProperty('sentimentAnalysis');
      expect(result).toHaveProperty('entityRecognition');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('outputTokens');

      // Verify all services were called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.aiAnalysis.create).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockOpenAI = service['openai'];
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API Error'));

      await expect(
        service.performCompleteAnalysis(
          'tweet-123',
          'tweet',
          'Test Title',
          'Test Content',
          'test-tenant-id'
        )
      ).rejects.toThrow('Analysis failed: OpenAI API Error');
    });
  });

  describe('calculateRealCost', () => {
    it('should calculate costs correctly', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      
      // Access private method for testing
      const cost = service['calculateRealCost'](inputTokens, outputTokens);
      
      // Expected: (1000/1000 * 0.00015) + (500/1000 * 0.0006) = 0.00015 + 0.0003 = 0.00045
      expect(cost).toBe(0.00045);
    });
  });
});