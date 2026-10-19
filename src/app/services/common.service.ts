import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Make an authenticated GET request with explicit token
   */
  get<T>(url: string): Observable<T> {
    return this.authService.getAccessToken().pipe(
      mergeMap(token => {
        const headers = this.getAuthHeaders(token);
        return this.http.get<T>(url, { headers });
      })
    );
  }

  /**
   * Make an authenticated POST request with explicit token
   */
  post<T>(url: string, body: any, options?: { responseType?: 'json' | 'text' }): Observable<T> {
    return this.authService.getAccessToken().pipe(
      mergeMap(token => {
        const headers = this.getAuthHeaders(token);
        return this.http.post<T>(url, body, { headers, ...(options ?? {}) });
      })
    );
  }

  /**
   * Make an authenticated PUT request with explicit token
   */
  put<T>(url: string, body: any, options?: { responseType?: 'json' | 'text' }): Observable<T> {
    return this.authService.getAccessToken().pipe(
      mergeMap(token => {
        const headers = this.getAuthHeaders(token);
        return this.http.put<T>(url, body, { headers, ...(options ?? {}) });
      })
    );
  }

  /**
   * Make an authenticated DELETE request with explicit token
   */
  delete<T>(url: string): Observable<T> {
    return this.authService.getAccessToken().pipe(
      mergeMap(token => {
        const headers = this.getAuthHeaders(token);
        return this.http.delete<T>(url, { headers });
      })
    );
  }

  /**
   * Make an authenticated GET request and return a Promise
   */
  async getAsync<T>(url: string): Promise<T> {
    const token = await firstValueFrom(this.authService.getAccessToken());
    const headers = this.getAuthHeaders(token);
    return firstValueFrom(this.http.get<T>(url, { headers }));
  }

  /**
   * Make an authenticated POST request and return a Promise
   */
  async postAsync<T>(url: string, body: any): Promise<T> {
    const token = await firstValueFrom(this.authService.getAccessToken());
    const headers = this.getAuthHeaders(token);
    return firstValueFrom(this.http.post<T>(url, body, { headers }));
  }

  /**
   * Get authorization headers with Bearer token
   */
  private getAuthHeaders(token: string): HttpHeaders {
    if (!environment.azureAd.enabled) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get the API base URL
   */
  getApiUrl(): string {
    return environment.apiUrl;
  }

  /**
   * Get full API endpoint URL
   */
  getApiEndpoint(endpoint: string): string {
    return `${environment.apiUrl}${endpoint}`;
  }
}
