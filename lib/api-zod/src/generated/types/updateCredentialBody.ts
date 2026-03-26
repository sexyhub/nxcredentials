export interface UpdateCredentialBody {
  title?: string;
  email?: string;
  password?: string;
  /** @nullable */
  tagId?: number | null;
  /** @nullable */
  vaultId?: number | null;
  /** @nullable */
  spaceId?: number | null;
}
