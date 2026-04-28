import { OAuth2Client } from 'google-auth-library'

export function initializeOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  return new OAuth2Client(clientId, clientSecret)
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  try {
    const oauth2Client = initializeOAuth2Client()
    
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri
    })

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    }
  } catch (error) {
    throw new Error(`Token exchange failed: ${error}`)
  }
}

export function generateAuthUrl(redirectUri: string, state?: string) {
  const oauth2Client = initializeOAuth2Client()
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    redirect_uri: redirectUri,
    state: state || 'default'
  })

  return authUrl
}
