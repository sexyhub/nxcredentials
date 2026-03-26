import type { TagStat } from "./tagStat";
import type { TypeStat } from "./typeStat";

export interface Stats {
  totalCredentials: number;
  totalTags: number;
  totalSpaces: number;
  totalVaults: number;
  recentlyAdded: number;
  vaultCredentials: number;
  spaceCredentials: number;
  uniqueTypes: number;
  /** @nullable */
  oldestCredentialDays: number | null;
  averageAgeDays: number;
  tagBreakdown: TagStat[];
  typeBreakdown: TypeStat[];
}
