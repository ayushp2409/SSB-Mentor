import { describe, it, expect, beforeEach } from 'vitest';
import { attemptService } from '../services/attemptService';
import { reflectionService } from '../services/reflectionService';

describe('Test Engine & Student Data Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accurately records WAT responses, latencies, and timeout skips', async () => {
    const attempt = await attemptService.createAttempt(
      'student_101',
      'WAT',
      'profile_wat_standard',
      1,
      60
    );
    expect(attempt.status).toBe('in_progress');

    // Simulate answering 2 words and skipping 1
    await attemptService.autosaveResponse(attempt.id, {
      questionId: 'wat_0001',
      responseText: 'Determination overcomes obstacles.',
      timeTakenMs: 4200,
      skipped: false,
    });

    await attemptService.autosaveResponse(attempt.id, {
      questionId: 'wat_0002',
      responseText: '',
      timeTakenMs: 15000,
      skipped: true, // timeout
    });

    await attemptService.autosaveResponse(attempt.id, {
      questionId: 'wat_0003',
      responseText: 'Teamwork achieves mission success.',
      timeTakenMs: 5100,
      skipped: false,
    });

    const completed = await attemptService.completeAttempt(attempt.id, 90);
    expect(completed.completedCount).toBe(2);
    expect(completed.skippedCount).toBe(1);
    expect(completed.status).toBe('completed');
  });

  it('enforces strict private data isolation between distinct students', async () => {
    // Student 1 attempts a test and writes a private reflection
    const att1 = await attemptService.createAttempt('student_alice', 'TAT', 'profile_tat_standard', 1, 12);
    await reflectionService.saveReflection({
      id: 'ref_alice_01',
      userId: 'student_alice',
      title: "Alice's Secret Journal",
      category: 'DAILY_JOURNAL',
      content: 'Confidential personal notes...',
      tags: ['private'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Student 2 attempts a test
    const att2 = await attemptService.createAttempt('student_bob', 'SRT', 'profile_srt_standard', 1, 60);
    await reflectionService.saveReflection({
      id: 'ref_bob_01',
      userId: 'student_bob',
      title: "Bob's Personal Entry",
      category: 'DAILY_JOURNAL',
      content: 'Bob confidential notes...',
      tags: ['private'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Alice queries attempts and reflections
    const aliceAttempts = await attemptService.getUserAttempts('student_alice');
    const aliceReflections = await reflectionService.getUserReflections('student_alice');

    expect(aliceAttempts.length).toBe(1);
    expect(aliceAttempts[0].id).toBe(att1.id);
    expect(aliceReflections.length).toBe(1);
    expect(aliceReflections[0].title).toBe("Alice's Secret Journal");

    // Verify Bob's data is completely absent from Alice's result set
    const bobInAliceAttempts = aliceAttempts.some((a) => a.userId === 'student_bob');
    const bobInAliceReflections = aliceReflections.some((r) => r.userId === 'student_bob');
    expect(bobInAliceAttempts).toBe(false);
    expect(bobInAliceReflections).toBe(false);
  });
});
