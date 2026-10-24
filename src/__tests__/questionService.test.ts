import { describe, it, expect, beforeEach } from 'vitest';
import { questionService } from '../services/questionService';
import { Question } from '../types';

describe('Question Bank Service & Deduplication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads real extracted SSB questions by category', async () => {
    const watWords = await questionService.getQuestionsByCategory('WAT', false);
    expect(watWords.length).toBeGreaterThan(100);
    expect(watWords[0].category).toBe('WAT');

    const srtSituations = await questionService.getQuestionsByCategory('SRT', false);
    expect(srtSituations.length).toBeGreaterThan(50);
    expect(srtSituations[0].category).toBe('SRT');
  });

  it('filters unpublished draft questions from public student view', async () => {
    const draftQ: Question = {
      id: 'wat_draft_test',
      category: 'WAT',
      subcategory: 'WORD_ASSOCIATION',
      title: 'TEST_WORD',
      content: 'TEST_WORD',
      tags: ['test'],
      verificationStatus: 'unverified',
      publicationStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await questionService.saveQuestion(draftQ);

    const publicQuestions = await questionService.getQuestionsByCategory('WAT', false);
    const foundInPublic = publicQuestions.some((q) => q.id === 'wat_draft_test');
    expect(foundInPublic).toBe(false);

    const allQuestions = await questionService.getQuestionsByCategory('WAT', true);
    const foundInAll = allQuestions.some((q) => q.id === 'wat_draft_test');
    expect(foundInAll).toBe(true);
  });

  it('batch imports questions idempotently skipping duplicate IDs', async () => {
    const sampleBatch: Question[] = [
      {
        id: 'batch_test_01',
        category: 'WAT',
        subcategory: 'WORD_ASSOCIATION',
        title: 'TENACITY',
        content: 'TENACITY',
        tags: ['olq'],
        verificationStatus: 'verified',
        publicationStatus: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'batch_test_01', // duplicate ID
        category: 'WAT',
        subcategory: 'WORD_ASSOCIATION',
        title: 'TENACITY',
        content: 'TENACITY',
        tags: ['olq'],
        verificationStatus: 'verified',
        publicationStatus: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const result = await questionService.batchImportQuestions(sampleBatch);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
