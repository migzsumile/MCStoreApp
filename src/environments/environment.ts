export const environment = {
  production: false,
  apiUrl: 'https://localhost:7048/',
  azureAd: {
    enabled: false,
    clientId: '',
    authority: '',
    redirectUri: '',
    scopes: ['']
  }
};

//Already set in Azure Devops Pipeline Variable group, so no need to set here.