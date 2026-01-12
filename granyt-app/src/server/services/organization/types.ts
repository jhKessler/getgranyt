export interface ApiKeyGenerated {
  id: string;
  key: string;
  prefix: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  type: string;
  environmentId: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  environment: {
    id: string;
    name: string;
    isDefault: boolean;
  } | null;
}

export interface EnvironmentInfo {
  id: string;
  name: string;
  isDefault: boolean;
  apiKeyCount: number;
  airflowUrl: string | null;
}

export interface OrganizationWithRole {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  memberCount: number;
}
