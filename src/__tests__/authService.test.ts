import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/authService';

describe('Auth Service & Role Security Guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default demo cadet profile when unauthenticated', () => {
    const user = authService.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('student');
    expect(user?.email).toBe('cadet@ssbmentor.in');
  });

  it('strictly prevents client registration from assigning admin role', async () => {
    const registered = await authService.register(
      'newcandidate@test.in',
      'Password123',
      'Cadet Test',
      'NDA'
    );
    expect(registered.role).toBe('student');
    expect(registered.displayName).toBe('Cadet Test');
    expect(registered.targetEntry).toBe('NDA');
  });

  it('rejects duplicate email registrations', async () => {
    await authService.register('duplicate@test.in', 'Pass1', 'Cadet One');
    await expect(
      authService.register('duplicate@test.in', 'Pass2', 'Cadet Two')
    ).rejects.toThrow('already exists');
  });

  it('allows switching demo role for administrative evaluation', () => {
    const admin = authService.switchDemoRole('admin');
    expect(admin.role).toBe('admin');
    expect(admin.email).toBe('admin@ssbmentor.in');

    const cadet = authService.switchDemoRole('student');
    expect(cadet.role).toBe('student');
  });
});
