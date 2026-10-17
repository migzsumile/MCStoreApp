export const environment = {
  production: false,
  apiUrl: 'https://localhost:7290/',
  azureAd: {
    clientId: '4160eb1a-ac43-4678-ac91-de1a7722202a',
    authority: 'https://login.microsoftonline.com/6883610c-d54f-4e57-a120-d19cd731f539',
    redirectUri: 'http://localhost:4200/',
    scopes: ['api://d7fc46d9-4d6c-4f65-ae3b-aed600e94f4d/user_impersonation']
  }
};