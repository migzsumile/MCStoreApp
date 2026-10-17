# Azure AD Token Usage Guide

This guide shows how to use the Azure AD token generation and authentication services in your Angular application.

## Services Overview

### 1. **AuthService** (`src/app/services/auth.service.ts`)
Handles token acquisition from Azure AD and user authentication.

**Key Methods:**
- `getAccessToken(): Observable<string>` - Get access token (acquires silently, with caching)
- `getCachedToken(): string | null` - Get previously cached token synchronously
- `isAuthenticated(): boolean` - Check if user is logged in
- `getCurrentUserEmail(): string` - Get logged-in user's email
- `getCurrentAccount()` - Get full account object
- `logout(): void` - Sign out user

### 2. **CommonService** (`src/app/services/common.service.ts`)
Wrapper for making authenticated HTTP calls with explicit token attachment.

**Key Methods:**
- `get<T>(url)` - GET request with Bearer token
- `post<T>(url, body)` - POST request with Bearer token
- `put<T>(url, body)` - PUT request with Bearer token
- `delete<T>(url)` - DELETE request with Bearer token
- `getAsync<T>(url)` - GET request (Promise-based)
- `postAsync<T>(url, body)` - POST request (Promise-based)

## Usage Examples

### Example 1: Using CommonService (Recommended for explicit token control)

```typescript
import { Component, inject } from '@angular/core';
import { CommonService } from './services/common.service';
import { Product } from './product/product.model';

@Component({
  selector: 'app-example',
  template: `<div>{{ products | json }}</div>`
})
export class ExampleComponent {
  private commonService = inject(CommonService);
  products: Product[] = [];

  constructor() {
    this.loadProducts();
  }

  // Observable-based approach
  loadProducts() {
    this.commonService.get<{ products: Product[] }>(
      this.commonService.getApiEndpoint('api/product/getAllProducts')
    ).subscribe(
      response => {
        this.products = response.products;
      },
      error => console.error('Error loading products:', error)
    );
  }

  // Promise-based approach
  async loadProductsAsync() {
    try {
      const response = await this.commonService.getAsync<{ products: Product[] }>(
        this.commonService.getApiEndpoint('api/product/getAllProducts')
      );
      this.products = response.products;
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  // Add a product
  addProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    this.commonService.post<Product>(
      this.commonService.getApiEndpoint('api/product'),
      product
    ).subscribe(
      newProduct => {
        this.products.push(newProduct);
      },
      error => console.error('Error adding product:', error)
    );
  }
}
```

### Example 2: Using AuthService directly (for token-only access)

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-auth-example',
  template: `
    <div>
      <p *ngIf="(authService.token$ | async) as token">
        Token: {{ token | slice:0:20 }}...
      </p>
      <p>Logged in as: {{ authService.getCurrentUserEmail() }}</p>
      <button (click)="logout()">Logout</button>
    </div>
  `
})
export class AuthExampleComponent {
  authService = inject(AuthService);

  // Get token as Observable
  getToken() {
    this.authService.getAccessToken().subscribe(token => {
      console.log('Access Token:', token);
      // Use token in custom HTTP calls
    });
  }

  // Check authentication
  checkAuth() {
    if (this.authService.isAuthenticated()) {
      console.log('User is authenticated');
      console.log('Email:', this.authService.getCurrentUserEmail());
    }
  }

  logout() {
    this.authService.logout();
  }
}
```

### Example 3: Using ProductService with explicit tokens

```typescript
import { Component, inject, signal } from '@angular/core';
import { ProductService } from './product/product.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-product-example',
  template: `<div>{{ products() | json }}</div>`
})
export class ProductExampleComponent {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  products = signal<any[]>([]);

  constructor() {
    this.loadProducts();
  }

  loadProducts() {
    // Auth service is now injected in ProductService
    this.productService.getProducts().subscribe(
      products => {
        this.products.set(products);
      },
      error => console.error('Error:', error)
    );
  }
}
```

## How It Works

### Automatic Token Flow (MsalInterceptor)

```
User makes HTTP request
    ↓
MsalInterceptor checks if URL is in protectedResourceMap
    ↓
Calls MsalService.acquireTokenSilent()
    ↓
Adds Authorization: Bearer <token> header
    ↓
Request sent to API
```

### CommonService Token Flow

```
Component calls commonService.get/post/put/delete()
    ↓
CommonService calls authService.getAccessToken()
    ↓
AuthService calls msalService.acquireTokenSilent()
    ↓
Token cached and returned
    ↓
CommonService adds Authorization: Bearer <token>
    ↓
HTTP request sent to API
```

## Configuration

The Azure AD configuration is in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7290/',
  azureAd: {
    clientId: '4160eb1a-ac43-4678-ac91-de1a7722202a',
    authority: 'https://login.microsoftonline.com/6883610c-d54f-4e57-a120-d19cd731f539',
    redirectUri: 'http://localhost:4200/',
    scopes: ['api://18708187-1ac0-4975-847b-4ca049e5bbc9/user_impersonation']
  }
};
```

## Best Practices

1. **Use CommonService** for most API calls - it handles token management automatically
2. **Use AuthService directly** if you need the token for other purposes
3. **Tokens are cached** - subsequent requests within token lifetime won't require re-authentication
4. **Error handling** - Always subscribe with error handlers in case token acquisition fails
5. **Logout on errors** - If token refresh fails, consider redirecting to login

## Troubleshooting

### "No user accounts found" error
- User hasn't logged in yet
- MsalGuard should prevent this by forcing login on protected routes

### Token expired
- MSAL automatically refreshes tokens silently
- If refresh fails, user will be redirected to login

### CORS errors
- Ensure API allows requests from `http://localhost:4200/`
- API should have proper CORS headers set up
