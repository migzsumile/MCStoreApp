import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../environments/environment';
import { retryApiRequestsInterceptor } from './retry.interceptor';

describe('retryApiRequestsInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryApiRequestsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('retries an API request twice before succeeding', () => {
    const url = `${environment.apiUrl}api/retry-test`;
    let result: unknown;

    http.get(url).subscribe(value => result = value);

    httpTesting.expectOne(url).flush('Server error', { status: 500, statusText: 'Server Error' });
    httpTesting.expectOne(url).flush('Server error', { status: 500, statusText: 'Server Error' });
    httpTesting.expectOne(url).flush({ success: true });

    expect(result).toEqual({ success: true });
  });

  it('returns the final HTTP error after three failed attempts', () => {
    const url = `${environment.apiUrl}api/retry-test`;
    let error: HttpErrorResponse | undefined;

    http.get(url).subscribe({ error: response => error = response });

    for (let attempt = 0; attempt < 3; attempt++) {
      httpTesting.expectOne(url).flush('Server error', { status: 500, statusText: 'Server Error' });
    }

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error?.status).toBe(500);
  });

  it('does not retry requests outside the configured API base URL', () => {
    const url = 'https://example.test/resource';
    let error: HttpErrorResponse | undefined;

    http.get(url).subscribe({ error: response => error = response });

    httpTesting.expectOne(url).flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(error).toBeInstanceOf(HttpErrorResponse);
    httpTesting.expectNone(url);
  });
});
