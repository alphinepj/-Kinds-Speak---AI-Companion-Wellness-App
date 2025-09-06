# OAuth Setup Guide for Kinds Speak

This guide explains how to set up OAuth authentication with Google and GitHub for your Kinds Speak application.

## Prerequisites

- A running Kinds Speak application
- Access to Google Cloud Console
- Access to GitHub Developer Settings

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: `Kinds Speak`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `openid`, `email`, `profile`
5. Save and continue

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set authorized redirect URIs:
   - `http://localhost:5001/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
5. Save the Client ID and Client Secret

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: `Kinds Speak`
   - Homepage URL: `http://localhost:5001` (development) or your domain
   - Authorization callback URL: `http://localhost:5001/auth/github/callback`
4. Register the application
5. Note the Client ID and generate a Client Secret

## Environment Configuration

Add the following variables to your `.env` file:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Integration

1. Start your Kinds Speak application
2. Navigate to the login page
3. Click on "Google" or "GitHub" buttons
4. Complete the OAuth flow
5. Verify successful login and user creation

## Production Deployment

For production deployment:

1. Update redirect URIs in both Google and GitHub OAuth apps
2. Use HTTPS URLs for all redirect URIs
3. Store OAuth secrets securely (environment variables, secrets manager)
4. Test the complete OAuth flow in production environment

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**: Ensure the redirect URI in your OAuth app matches exactly
2. **OAuth state mismatch**: Clear browser cookies and try again
3. **Missing scopes**: Verify required scopes are configured in OAuth consent screen
4. **Rate limiting**: Implement proper error handling for API rate limits

### Debug Mode

Enable debug logging in your application to troubleshoot OAuth issues:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Security Considerations

1. Always use HTTPS in production
2. Implement proper CSRF protection
3. Validate OAuth state parameter
4. Store user sessions securely
5. Regularly rotate OAuth secrets
6. Implement proper error handling

## Features Supported

- ✅ Google OAuth login/registration
- ✅ GitHub OAuth login/registration  
- ✅ Guest login (no registration required)
- ✅ Traditional email/password authentication
- ✅ Automatic user account creation from OAuth
- ✅ Profile data synchronization from OAuth providers
- ✅ Session management across all login methods

## API Endpoints

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/<provider>/callback` - Handle OAuth callback
- `POST /auth/guest` - Create guest session

Your Kinds Speak application now supports multiple authentication methods for enhanced user experience!
