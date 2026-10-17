import { HttpInterceptorFn } from '@angular/common/http';
import { retry } from 'rxjs';
import { environment } from '../environments/environment';

export const retryApiRequestsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  return next(request).pipe(retry(2));
};
