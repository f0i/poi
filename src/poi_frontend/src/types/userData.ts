import { Principal } from "@dfinity/principal";

export type Provider = { github: null } | { twitter: null } | { discord: null };

export interface User {
  avatar_url: string | null;
  bio: string | null;
  createdAt: bigint;
  email: string | null;
  email_verified: boolean | null;
  followers_count: bigint | null;
  following_count: bigint | null;
  id: string;
  location: string | null;
  name: string | null;
  origin: string;
  provider: Provider;
  provider_created_at: string | null;
  public_gists: bigint | null;
  public_repos: bigint | null;
  tweet_count: bigint | null;
  username: string | null;
  verified: boolean | null;
  website: string | null;
}

export interface UserDataBackend {
  getUser: (args: {
    principal: Principal;
    origin: string;
  }) => Promise<User | null>;
}
