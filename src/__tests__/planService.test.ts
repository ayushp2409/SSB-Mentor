import { describe, it, expect, beforeEach } from 'vitest';
import { planService } from '../services/planService';

describe('Daily Planner & Target Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a balanced 90-minute daily preparation plan', async () => {
    const plan = await planService.getDailyPlan('user_test_001', '2026-10-26', 90);
    expect(plan).toBeDefined();
    expect(plan.userId).toBe('user_test_001');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(4);

    const totalEstimated = plan.tasks.reduce((acc, t) => acc + t.durationMinutes, 0);
    expect(totalEstimated).toBeGreaterThanOrEqual(70);
  });

  it('toggles task completion status accurately', async () => {
    const plan = await planService.getDailyPlan('user_test_001', '2026-10-26', 90);
    const firstTask = plan.tasks[0];
    expect(firstTask.isCompleted).toBe(false);

    const updated = await planService.toggleTask('user_test_001', '2026-10-26', firstTask.taskId);
    const toggledTask = updated.tasks.find((t) => t.taskId === firstTask.taskId);
    expect(toggledTask?.isCompleted).toBe(true);
    expect(toggledTask?.completedAt).not.toBeNull();
    expect(updated.status).toBe('in_progress');
  });

  it('provides rest and review schedule on Sundays without overwhelming aspirant', async () => {
    // 2026-10-25 was a Sunday
    const sundayPlan = await planService.getDailyPlan('user_test_001', '2026-10-25', 90);
    const hasReview = sundayPlan.tasks.some((t) => t.title.toLowerCase().includes('review'));
    expect(hasReview).toBe(true);
  });
});
