export const environment = {
  production: true,
  apiUrl: '',
  azureAd: {
    enabled: true,
    clientId: '',
    authority: '',
    redirectUri: '',
    scopes: ['']
  }
};

//Already set in Azure Devops Pipeline Variable group, so no need to set here.