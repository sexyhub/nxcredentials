export interface Credential {
  id: number;
  title: string;
  email: string;
  password: string;
  /** @nullable */
  tagId: number | null;
  /** @nullable */
  tagName: string | null;
  /** @nullable */
  tagColor: string | null;
  /** @nullable */
  vaultId: number | null;
  /** @nullable */
  spaceId: number | null;
  /** @nullable */
  spaceName: string | null;
  createdAt: Date;
  updatedAt: Date;
}
