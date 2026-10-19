import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('routes with the local authentication bypass', () => {
  it('allows navigation without the Azure AD guard', () => {
    expect(routes.every(route => route.canActivate?.length === 0)).toBe(true);
  });
});
