export type Rank = "E" | "D" | "C" | "B" | "A" | "S";
export type Pool = { value: number; max: number; temp: number };
export type Pools = { hp: Pool; chakra: Pool };
export type Envelope = { version: 1; id: string; targetUuid: string };
export type Source = { id: string; kind: string; actorUuid: string | null; itemUuid: string | null; castId: string | null };

/** World timestamps are seconds; resource amounts are nonnegative integer points. */
export interface ConditionApplication extends Envelope {
  source: Source; key: string; ranks: number; sourceRank: Rank | null;
  stackingPolicyId: string | null; expiresAt: number | null;
}
export interface SaveOutcome extends Envelope {
  source: Source; activityId: string; rollUuid: string; policyId: string;
  outcome: "critFailure" | "failure" | "success" | "critSuccess";
  total: number; dc: number; natural: number;
  damagePacketIds: string[]; conditionApplicationIds: string[];
}
export interface DamageComponent { id: string; type: string; pool: "hp" | "chakra"; amount: number }
export interface DamagePacket extends Envelope {
  source: Source; kind: "damage"; rollUuid: string | null; critical: boolean;
  components: DamageComponent[];
}
export interface DamageResult extends Envelope {
  packetId: string; before: Pools; after: Pools;
  components: Array<Omit<DamageComponent, "amount"> & { afterDefenses: number }>;
  concentration: { damageAmount: number | null; policyId: string | null };
}
export interface MaintainedCast extends Envelope {
  source: Source; itemUuid: string; castId: string; baseRank: Rank; castRank: Rank;
  actualChakraPaid: number; stable: boolean; efficient: boolean;
  dependentEffectUuids: string[]; expiresAt: number | null;
}
export interface ResourceSpend extends Envelope {
  source: Source; kind: "spend"; pool: "chakra"; amount: number; reason: "cast" | "upkeep" | "feature";
}
export interface ActorSnapshot extends Envelope {
  pools: Pools; conditionApplicationIds: string[]; maintainedCastIds: string[];
}

/** Native rolls supply their kept d20 and stored reference; planners never fabricate a replacement roll. */
export interface SaveRollRequest extends Envelope { activityUuid: string; ability: string; dc: number }
export interface NativeRollResult { rollUuid: string; total: number; natural: number }

/** The application layer receives one operation bundle; this is not a distributed transaction guarantee. */
export interface MutationPlan extends Envelope {
  damage: DamageResult | null;
  createConditions: ConditionApplication[];
  removeEffectUuids: string[];
  maintainedCasts: MaintainedCast[];
}

/** Implement these methods with native documents and lifecycle methods in later batches. */
export interface NativeAdapter {
  readActor(actorUuid: string): Promise<ActorSnapshot>;
  rollSave(request: SaveRollRequest): Promise<NativeRollResult>;
  consumeResource(request: ResourceSpend): Promise<{ operationId: string; paid: number }>;
  applyMutation(plan: MutationPlan): Promise<{ operationId: string; applied: boolean }>;
}
