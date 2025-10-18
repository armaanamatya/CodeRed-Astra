import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

interface NotionProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  workspace: {
    id: string;
    name: string;
  };
}

interface NotionTokens {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string;
  workspace_icon?: string;
  workspace_id: string;
  owner?: {
    type: string;
    user: {
      object: string;
      id: string;
      name: string;
      avatar_url?: string;
    };
  };
}

export default function NotionProvider<P extends NotionProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'notion',
    name: 'Notion',
    type: 'oauth',
    authorization: {
      url: 'https://api.notion.com/v1/oauth/authorize',
      params: {
        response_type: 'code',
        owner: 'user',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/notion`,
      },
    },
    token: {
      url: 'https://api.notion.com/v1/oauth/token',
      async request({ client, params, checks, provider }) {
        const response = await fetch(provider.token.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(
              `${options.clientId}:${options.clientSecret}`
            ).toString('base64')}`,
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: provider.callbackUrl,
          }),
        });

        const tokens = await response.json();
        return { tokens };
      },
    },
    userinfo: {
      url: 'https://api.notion.com/v1/users/me',
      async request({ tokens, provider }) {
        const response = await fetch(provider.userinfo.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Notion-Version': '2022-06-28',
          },
        });

        const user = await response.json();
        return {
          id: user.id,
          name: user.name,
          email: user.person?.email || user.bot?.owner?.user?.email,
          image: user.avatar_url,
          notion_access_token: tokens.access_token,
          notion_workspace_id: tokens.workspace_id,
          notion_workspace_name: tokens.workspace_name,
        };
      },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
        notion_access_token: profile.notion_access_token,
        notion_workspace_id: profile.notion_workspace_id,
        notion_workspace_name: profile.notion_workspace_name,
      };
    },
    options,
  };
}
