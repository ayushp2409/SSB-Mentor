import { describe, it, expect, beforeEach } from 'vitest';
import { authService, generateUserIdFromEmail } from '../services/authService';

describe('Auth Service & User Progress Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when visitor is unauthenticated', () => {
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('allows signup with only email and password (no external auth required)', async () => {
    const registered = await authService.register('cadet_vikram@gmail.com', 'mypassword');
    expect(registered).toBeDefined();
    expect(registered.email).toBe('cadet_vikram@gmail.com');
    expect(registered.role).toBe('student');
    expect(registered.id).toBe(generateUserIdFromEmail('cadet_vikram@gmail.com'));
    expect(registered.displayName).toContain('Cadet Vikram');

    // Currently logged in user should be this registered cadet
    const current = authService.getCurrentUser();
    expect(current?.email).toBe('cadet_vikram@gmail.com');
  });

  it('allows logging in with registered email and password', async () => {
    await authService.register('aspirant2026@gmail.com', 'securepass123');
    await authService.logout();
    expect(authService.getCurrentUser()).toBeNull();

    const loggedIn = await authService.login('aspirant2026@gmail.com', 'securepass123');
    expect(loggedIn.email).toBe('aspirant2026@gmail.com');
    expect(authService.getCurrentUser()?.email).toBe('aspirant2026@gmail.com');
  });

  it('rejects login with invalid password', async () => {
    await authService.register('cadet@test.in', 'correctpassword');
    await authService.logout();

    await expect(authService.login('cadet@test.in', 'wrongpassword')).rejects.toThrow('Incorrect password');
  });

  it('isolates user identities between different email accounts', async () => {
    const userA = await authService.register('cadetA@gmail.com', 'passA');
    await authService.logout();

    const userB = await authService.register('cadetB@gmail.com', 'passB');

    expect(userA.id).not.toBe(userB.id);
    expect(userA.email).not.toBe(userB.email);
  });
});
