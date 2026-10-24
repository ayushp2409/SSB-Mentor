import { DailyPlan, DailyTask, QuestionCategory } from '../types';
import { isFirebaseConfigured, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const STORAGE_KEY_PLANS = 'ssb_mentor_daily_plans';

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getLocalPlans(): Record<string, DailyPlan> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveLocalPlans(plans: Record<string, DailyPlan>) {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.warn('Could not save daily plans:', e);
  }
}

export const planService = {
  getTodayDateString(): string {
    return getTodayString();
  },

  async getDailyPlan(userId: string, dateStr: string = getTodayString(), targetMinutes: number = 90): Promise<DailyPlan> {
    const planId = `${userId}_${dateStr}`;

    if (isFirebaseConfigured) {
      const snap = await getDoc(doc(db, 'dailyPlans', planId));
      if (snap.exists()) {
        return snap.data() as DailyPlan;
      }
    }

    const plans = getLocalPlans();
    if (plans[planId]) {
      return plans[planId];
    }

    // Generate balanced new plan with intelligent module rotation
    const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sun, 1 = Mon ...
    const generatedTasks: DailyTask[] = [];

    // Sunday = Rest / Weekly Review Day
    if (dayOfWeek === 0) {
      generatedTasks.push(
        { taskId: 'task_rev_1', module: 'TAT', title: 'Weekly Review: Read through your best TAT stories', durationMinutes: 20, isCompleted: false },
        { taskId: 'task_rev_2', module: 'INTERVIEW', title: 'Self-Awareness: Update Personal CIQ Journal', durationMinutes: 20, isCompleted: false },
        { taskId: 'task_rev_3', module: 'CURRENT_AFFAIRS', title: 'Weekly Defense News Summary & Notes', durationMinutes: 20, isCompleted: false },
      );
    } else {
      // Rotate Psychology: Mon/Wed/Fri = TAT + WAT; Tue/Thu/Sat = SRT + PPDT
      if (dayOfWeek % 2 === 1) {
        generatedTasks.push(
          { taskId: 'task_psy_1', module: 'TAT', title: 'Thematic Apperception Test (3-Picture Drill)', durationMinutes: 20, isCompleted: false },
          { taskId: 'task_psy_2', module: 'WAT', title: 'WAT Rapid Word Association (60 Words)', durationMinutes: 15, isCompleted: false }
        );
      } else {
        generatedTasks.push(
          { taskId: 'task_psy_1', module: 'SRT', title: 'Situation Reaction Sprint (20 Situations)', durationMinutes: 20, isCompleted: false },
          { taskId: 'task_psy_2', module: 'PPDT', title: 'PPDT Picture Observation & Story Writing', durationMinutes: 15, isCompleted: false }
        );
      }

      // Rotate GTO / Lecturette: Mon/Wed/Sat = Lecturette; Tue/Thu/Fri = GPE Scenario
      if (dayOfWeek % 2 === 1) {
        generatedTasks.push(
          { taskId: 'task_gto_1', module: 'LECTURETTE', title: 'Lecturette Practice: 3m Prep & 3m Speech', durationMinutes: 20, isCompleted: false }
        );
      } else {
        generatedTasks.push(
          { taskId: 'task_gto_1', module: 'GTO', title: 'GPE Scenario Analysis: Priority & Time Calculations', durationMinutes: 20, isCompleted: false }
        );
      }

      // Interview & Self-Awareness
      generatedTasks.push(
        { taskId: 'task_int_1', module: 'INTERVIEW', title: 'Personal Interview: Prepare 1 CIQ Module & Experiences', durationMinutes: 15, isCompleted: false }
      );

      // Current Affairs & Reflection
      generatedTasks.push(
        { taskId: 'task_ca_1', module: 'CURRENT_AFFAIRS', title: 'Current Affairs: Strategic Maritime & Border Security', durationMinutes: 15, isCompleted: false },
        { taskId: 'task_ref_1', module: 'CURRENT_AFFAIRS', title: 'Daily Self-Reflection & Journaling', durationMinutes: 5, isCompleted: false }
      );
    }

    // Check for incomplete tasks from yesterday to gracefully roll over without creating a flood
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayPlan = plans[`${userId}_${yesterday}`];
    let rolloverFrom: string | null = null;
    if (yesterdayPlan) {
      const unfinished = yesterdayPlan.tasks.filter(t => !t.isCompleted);
      if (unfinished.length > 0 && unfinished.length <= 2) {
        // Carry forward at most 1 high priority task to prevent endless backlog
        const carryTask = unfinished[0];
        generatedTasks.unshift({
          ...carryTask,
          taskId: `rollover_${carryTask.taskId}`,
          title: `[Rollover] ${carryTask.title}`
        });
        rolloverFrom = yesterday;
      }
    }

    const newPlan: DailyPlan = {
      id: planId,
      userId,
      date: dateStr,
      targetMinutes,
      tasks: generatedTasks,
      status: 'planned',
      rolloverFromDate: rolloverFrom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    plans[planId] = newPlan;
    saveLocalPlans(plans);

    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'dailyPlans', planId), newPlan);
    }

    return newPlan;
  },

  async toggleTask(userId: string, dateStr: string, taskId: string): Promise<DailyPlan> {
    const plan = await this.getDailyPlan(userId, dateStr);
    const task = plan.tasks.find(t => t.taskId === taskId);
    if (!task) return plan;

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date().toISOString() : null;

    const completedCount = plan.tasks.filter(t => t.isCompleted).length;
    plan.status = completedCount === plan.tasks.length ? 'completed' : completedCount > 0 ? 'in_progress' : 'planned';
    plan.updatedAt = new Date().toISOString();

    const plans = getLocalPlans();
    plans[plan.id] = plan;
    saveLocalPlans(plans);

    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'dailyPlans', plan.id), {
        tasks: plan.tasks,
        status: plan.status,
        updatedAt: plan.updatedAt,
      });
    }

    return plan;
  }
};
