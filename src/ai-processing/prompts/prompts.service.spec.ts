import { Test, TestingModule } from '@nestjs/testing';
import { PromptsService } from './prompts.service';

describe('PromptsService', () => {
  let service: PromptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptsService],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemPrompt', () => {
    it('should return system prompt with Mexican context', () => {
      const prompt = service.getSystemPrompt();
      
      expect(prompt).toContain('contexto gubernamental mexicano');
      expect(prompt).toContain('MORENA, PAN, PRI, MC, PT, PVEM, PRD');
      expect(prompt).toContain('2024-2025');
      expect(prompt).toContain('JSON válido');
    });
  });

  describe('getTextAnalysisPrompt', () => {
    it('should generate text analysis prompt with title and content', () => {
      const title = 'Test News Title';
      const content = 'This is test content about Mexican politics';
      
      const prompt = service.getTextAnalysisPrompt(title, content);
      
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('impacto gubernamental');
      expect(prompt).toContain('política_interna');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('aiSummary');
      expect(prompt).toContain('executiveSummary');
      expect(prompt).toContain('keyPoints');
    });

    it('should include word count calculation in prompt', () => {
      const title = 'Test';
      const content = 'Word count test content';
      
      const prompt = service.getTextAnalysisPrompt(title, content);
      
      expect(prompt).toContain('wordCount": ' + content.split(' ').length);
    });
  });

  describe('getSentimentAnalysisPrompt', () => {
    it('should generate sentiment analysis prompt', () => {
      const title = 'Political News';
      const content = 'Content about government criticism';
      
      const prompt = service.getSentimentAnalysisPrompt(title, content);
      
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('gobierno mexicano');
      expect(prompt).toContain('overallSentiment');
      expect(prompt).toContain('sentimentScore');
      expect(prompt).toContain('emotionalProfile');
      expect(prompt).toContain('urgencyLevel');
      expect(prompt).toContain('positive|negative|neutral|mixed');
    });

    it('should include Mexican political context considerations', () => {
      const prompt = service.getSentimentAnalysisPrompt('Title', 'Content');
      
      expect(prompt).toContain('político mexicano actual');
      expect(prompt).toContain('controversia política');
      expect(prompt).toContain('respuesta gubernamental');
    });
  });

  describe('getEntityRecognitionPrompt', () => {
    it('should generate entity recognition prompt for Mexican context', () => {
      const title = 'Government News';
      const content = 'AMLO announced new policy';
      
      const prompt = service.getEntityRecognitionPrompt(title, content);
      
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('gubernamental mexicano');
      expect(prompt).toContain('MORENA, PAN, PRI');
      expect(prompt).toContain('Secretarías');
      expect(prompt).toContain('persons');
      expect(prompt).toContain('organizations');
      expect(prompt).toContain('locations');
      expect(prompt).toContain('governmentEntities');
    });

    it('should include Mexican government structure examples', () => {
      const prompt = service.getEntityRecognitionPrompt('Title', 'Content');
      
      expect(prompt).toContain('Andrés Manuel López Obrador');
      expect(prompt).toContain('Secretaría de Hacienda');
      expect(prompt).toContain('Ciudad de México');
      expect(prompt).toContain('Instituto Nacional Electoral');
      expect(prompt).toContain('federal|estatal|municipal');
    });
  });

  describe('getRiskAssessmentPrompt', () => {
    it('should generate risk assessment prompt', () => {
      const title = 'Crisis News';
      const content = 'Political crisis in Mexico';
      
      const prompt = service.getRiskAssessmentPrompt(title, content);
      
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('gobierno mexicano');
      expect(prompt).toContain('overallRiskScore');
      expect(prompt).toContain('riskCategories');
      expect(prompt).toContain('governanceImpact');
      expect(prompt).toContain('recommendedActions');
    });

    it('should include sentiment context when provided', () => {
      const prompt = service.getRiskAssessmentPrompt(
        'Title',
        'Content',
        -0.8
      );
      
      expect(prompt).toContain('Contexto de sentimiento: -0.8 (negativo)');
    });

    it('should include entities context when provided', () => {
      const entities = {
        persons: [{ name: 'AMLO', role: 'President' }],
        organizations: [],
        locations: [],
        governmentEntities: []
      };
      
      const prompt = service.getRiskAssessmentPrompt(
        'Title',
        'Content',
        undefined,
        entities
      );
      
      expect(prompt).toContain('Entidades clave identificadas:');
      expect(prompt).toContain('AMLO');
    });

    it('should include Mexican political context and risk scoring', () => {
      const prompt = service.getRiskAssessmentPrompt('Title', 'Content');
      
      expect(prompt).toContain('contexto político mexicano actual (2024-2025)');
      expect(prompt).toContain('Score de 80+ = Crisis severa');
      expect(prompt).toContain('Score de 60-79 = Riesgo alto');
      expect(prompt).toContain('corrupcion|crisis_social|crisis_economica');
    });
  });

  describe('prompt consistency', () => {
    it('should return consistent prompts for same inputs', () => {
      const title = 'Consistent Test';
      const content = 'Consistent content';
      
      const prompt1 = service.getTextAnalysisPrompt(title, content);
      const prompt2 = service.getTextAnalysisPrompt(title, content);
      
      expect(prompt1).toBe(prompt2);
    });

    it('should handle empty or null inputs gracefully', () => {
      expect(() => service.getTextAnalysisPrompt('', '')).not.toThrow();
      expect(() => service.getSentimentAnalysisPrompt('', '')).not.toThrow();
      expect(() => service.getEntityRecognitionPrompt('', '')).not.toThrow();
      expect(() => service.getRiskAssessmentPrompt('', '')).not.toThrow();
    });
  });

  describe('JSON structure validation', () => {
    it('should include proper JSON structure examples in all prompts', () => {
      const prompts = [
        service.getTextAnalysisPrompt('Title', 'Content'),
        service.getSentimentAnalysisPrompt('Title', 'Content'),
        service.getEntityRecognitionPrompt('Title', 'Content'),
        service.getRiskAssessmentPrompt('Title', 'Content'),
      ];

      prompts.forEach(prompt => {
        expect(prompt).toContain('{');
        expect(prompt).toContain('}');
        expect(prompt).toContain('"');
      });
    });

    it('should specify EXACTA structure requirement', () => {
      const prompts = [
        service.getTextAnalysisPrompt('Title', 'Content'),
        service.getSentimentAnalysisPrompt('Title', 'Content'),
        service.getEntityRecognitionPrompt('Title', 'Content'),
        service.getRiskAssessmentPrompt('Title', 'Content'),
      ];

      prompts.forEach(prompt => {
        expect(prompt.toLowerCase()).toContain('exacta');
      });
    });
  });
});