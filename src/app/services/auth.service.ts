import { Injectable, inject } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';
import { Observable, from, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, tap, catchError, filter } from 'rxjs/operators';
import { AuthenticationResult } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  /**
   * Acquire access token silently (uses cached token if available)
   * @returns Observable<string> - Access token
   */
  getAccessToken(): Observable<string> {
    return from(this.acquireTokenSilent()).pipe(
      map(result => result.accessToken),
      tap(token => this.tokenSubject.next(token)),
      catchError(error => {
        console.error('Error acquiring token:', error);
        throw error;
      })
    );
  }

  /**
   * Acquire token silently - returns the token acquisition result
   * @returns Promise<AuthenticationResult>
   */
  private async acquireTokenSilent(): Promise<AuthenticationResult> {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length === 0) {
      if (typeof window !== 'undefined') {
        this.msalService.loginRedirect({
          scopes: environment.azureAd.scopes
        });
      }
      throw new Error('No user accounts found. Please login first.');
    }

    const account = accounts[0];
    return this.msalService.instance.acquireTokenSilent({
      scopes: environment.azureAd.scopes,
      account: account
    });
  }

  /**
   * Get the current cached token synchronously
   * @returns string | null
   */
  getCachedToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  /**
   * Wait for authentication to complete
   * @returns Observable<boolean> - true when user is authenticated
   */
  waitForAuthentication(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    // Listen for authentication events
    return this.msalBroadcastService.msalSubject$.pipe(
      filter(result => result !== null),
      filter(() => this.isAuthenticated()),
      map(() => true),
      tap(() => console.log('User authenticated')),
      catchError(error => {
        console.error('Authentication error:', error);
        throw error;
      })
    );
  }

  /**
   * Get the current user account
   */
  getCurrentAccount() {
    const accounts = this.msalService.instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * Get current user email
   */
  getCurrentUserEmail(): string | undefined {
    const account = this.getCurrentAccount();
    return account?.username;
  }

  /**
   * Logout the user
   */
  logout(): void {
    this.msalService.logoutRedirect();
    this.tokenSubject.next(null);
  }
}

