import { describe, it, expect, beforeEach } from 'vitest';
import { candidateMemoryService } from '../services/candidateMemoryService';
import {
  evaluateTATStory,
  evaluateWATBatch,
  evaluateSRTBatch,
  getInterviewNextQuestion,
  evaluateInterviewSession,
} from '../services/aiService';

describe('Candidate Memory Service', () => {
  const testUserId = 'test_cadet_001';

  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes default empty PIQ profile for user', () => {
    const piq = candidateMemoryService.getPIQ(testUserId);
    expect(piq).toBeDefined();
    expect(piq.userId).toBe(testUserId);
    expect(piq.name).toBe('');
  });

  it('saves and retrieves updated PIQ profile', () => {
    const updated = candidateMemoryService.savePIQ(testUserId, {
      name: 'Cadet Batra',
      age: 22,
      targetEntry: 'CDS (IMA)',
      motivationForForces: 'To lead soldiers in combat.',
    });

    expect(updated.name).toBe('Cadet Batra');
    expect(updated.age).toBe(22);

    const reloaded = candidateMemoryService.getPIQ(testUserId);
    expect(reloaded.name).toBe('Cadet Batra');
    expect(reloaded.targetEntry).toBe('CDS (IMA)');
  });

  it('records OLQ evidence items and generates summary counts', () => {
    candidateMemoryService.addOLQEvidence(testUserId, [
      {
        olqName: 'Initiative',
        level: 'positive_evidence',
        evidence: 'Immediately took charge of extinguishing the fire.',
        source: 'SRT',
        sessionId: 'sess_1',
        timestamp: new Date().toISOString(),
      },
      {
        olqName: 'Organising Ability',
        level: 'developing',
        evidence: 'Divided tasks systematically among the volunteer team.',
        source: 'TAT',
        sessionId: 'sess_2',
        timestamp: new Date().toISOString(),
      },
    ]);

    const summary = candidateMemoryService.getOLQSummary(testUserId);
    expect(summary['Initiative']).toBeDefined();
    expect(summary['Initiative'].evidenceCount).toBe(1);
    expect(summary['Initiative'].level).toBe('positive_evidence');

    expect(summary['Organising Ability']).toBeDefined();
    expect(summary['Organising Ability'].level).toBe('developing');
  });

  it('persists and clears mentor conversations', () => {
    candidateMemoryService.addMentorMessage(testUserId, {
      id: 'm1',
      role: 'candidate',
      content: 'What should I practise today?',
      timestamp: new Date().toISOString(),
    });

    const session = candidateMemoryService.getMentorSession(testUserId);
    expect(session.messages.length).toBe(1);
    expect(session.messages[0].content).toBe('What should I practise today?');

    candidateMemoryService.clearMentorHistory(testUserId);
    const cleared = candidateMemoryService.getMentorSession(testUserId);
    expect(cleared.messages.length).toBe(0);
  });
});

describe('AI Evaluation Heuristics (Zero-Credential Offline Guarantee)', () => {
  it('evaluates TAT stories and extracts micro-actions', async () => {
    const story =
      'Ravi noticed that the village dam had a crack during heavy monsoon rains. He immediately alerted the village head and organized a group of 15 youth. He divided them into 3 teams: one team brought sandbags, one team evacuated families near the bank, and one team informed the irrigation department. With collective effort, they placed sandbags to plug the breach until engineers arrived.';

    const result = await evaluateTATStory(story, 'tat_001.jpeg');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.microActions.length).toBeGreaterThan(0);
    expect(result.data?.strengths.length).toBeGreaterThan(0);
    expect(result.data?.disclaimer).toContain('AI-assisted practice tool');
  });

  it('evaluates WAT response batches and identifies generic/cliche patterns', async () => {
    const responses = [
      { word: 'Lead', response: 'Lead by example' },
      { word: 'Danger', response: 'Danger is faced with courage and calm planning' },
      { word: 'Failure', response: 'Failure teaches valuable lessons for future success' },
    ];

    const result = await evaluateWATBatch(responses);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.analyzedResponses.length).toBe(3);
    expect(result.data?.practiceRecommendations.length).toBeGreaterThan(0);
  });

  it('evaluates SRT response batches for practicality and decision-making', async () => {
    const responses = [
      {
        situation: 'While trekking, his friend slipped and fractured his leg with darkness falling.',
        response: 'First rendered first aid, immobilized the fracture with splints, pitched shelter, and sent distress location beacon.',
      },
    ];

    const result = await evaluateSRTBatch(responses);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.analyzedResponses[0].practicality).toBe('high');
  });

  it('generates dynamic next interview question', async () => {
    const piq = { name: 'Cadet Batra', targetEntry: 'CDS' };
    const messages = [
      { id: '1', role: 'interviewer' as const, content: 'Tell me about yourself.', timestamp: '' },
      { id: '2', role: 'candidate' as const, content: 'I am a computer engineering graduate from Pune who wants to join the Army.', timestamp: '' },
    ];

    const result = await getInterviewNextQuestion(messages, piq);
    expect(result.success).toBe(true);
    expect(result.data?.question).toBeDefined();
    expect(result.data?.category).toBeDefined();
  });

  it('evaluates full interview session across 8 dimensions', async () => {
    const piq = { name: 'Cadet Batra', targetEntry: 'CDS' };
    const messages = [
      { id: '1', role: 'interviewer' as const, content: 'Why do you want to join the forces?', timestamp: '' },
      { id: '2', role: 'candidate' as const, content: 'I want an adventurous career that offers purposeful leadership and service to the nation.', timestamp: '' },
    ];

    const result = await evaluateInterviewSession(messages, piq);
    expect(result.success).toBe(true);
    expect(result.data?.clarityOfThought).toBeDefined();
    expect(result.data?.communication).toBeDefined();
    expect(result.data?.olqEvidence.length).toBeGreaterThan(0);
  });
});
