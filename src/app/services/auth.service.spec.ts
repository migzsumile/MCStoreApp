import { TestBed } from '@angular/core/testing';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Subject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService with local authentication bypass', () => {
  const msalService = {
    instance: {
      getAllAccounts: vi.fn().mockReturnValue([]),
      acquireTokenSilent: vi.fn()
    },
    loginRedirect: vi.fn(),
    logoutRedirect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: MsalService, useValue: msalService },
        { provide: MsalBroadcastService, useValue: { msalSubject$: new Subject() } }
      ]
    });
  });

  it('allows the app to proceed without acquiring or redirecting for a token', async () => {
    const authService = TestBed.inject(AuthService);

    expect(authService.isAuthenticated()).toBe(true);
    expect(await firstValueFrom(authService.waitForAuthentication())).toBe(true);
    expect(await firstValueFrom(authService.getAccessToken())).toBe('');
    expect(msalService.instance.getAllAccounts).not.toHaveBeenCalled();
    expect(msalService.instance.acquireTokenSilent).not.toHaveBeenCalled();
    expect(msalService.loginRedirect).not.toHaveBeenCalled();
  });

  it('clears local token state without redirecting to Azure AD on logout', () => {
    const authService = TestBed.inject(AuthService);

    authService.logout();

    expect(authService.getCachedToken()).toBeNull();
    expect(msalService.logoutRedirect).not.toHaveBeenCalled();
  });
});
