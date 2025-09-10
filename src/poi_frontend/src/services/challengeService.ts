import { createActor, canisterId } from "../../../declarations/poi_backend";
import { Identity } from "@dfinity/agent";

export type ChallengeType = { follows: { user: string } };

export interface Challenge {
  id: bigint;
  description: string;
  challengeType: ChallengeType;
  points: bigint;
}

export class ChallengeService {
  private actor: any = null;

  constructor(private identity?: Identity) {}

  private getActor() {
    if (!this.actor) {
      if (!canisterId) {
        throw new Error(
          "Backend canister not available. Make sure CANISTER_ID_POI_BACKEND environment variable is set.",
        );
      }

      const options: any = {};
      if (this.identity) {
        options.agentOptions = { identity: this.identity };
      }

      this.actor = createActor(canisterId, options);
    }
    return this.actor;
  }

  async getChallenges(): Promise<Challenge[]> {
    try {
      const actor = this.getActor();
      const result = await actor.getChallenges();
      return result;
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      return [];
    }
  }

  async getChallenge(id: bigint): Promise<Challenge | null> {
    try {
      const actor = this.getActor();
      const result = await actor.getChallenge(id);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to fetch challenge:", error);
      return null;
    }
  }

  async createChallenge(
    description: string,
    challengeType: ChallengeType,
    points: bigint,
  ): Promise<bigint | null> {
    try {
      const actor = this.getActor();
      const result = await actor.createChallenge(
        description,
        challengeType,
        points,
      );
      return result;
    } catch (error) {
      console.error("Failed to create challenge:", error);
      return null;
    }
  }

  async updateChallenge(
    id: bigint,
    description: string,
    challengeType: ChallengeType,
    points: bigint,
  ): Promise<boolean> {
    try {
      const actor = this.getActor();
      const result = await actor.updateChallenge(
        id,
        description,
        challengeType,
        points,
      );
      return result;
    } catch (error) {
      console.error("Failed to update challenge:", error);
      return false;
    }
  }

  async deleteChallenge(id: bigint): Promise<boolean> {
    try {
      const actor = this.getActor();
      const result = await actor.deleteChallenge(id);
      return result;
    } catch (error) {
      console.error("Failed to delete challenge:", error);
      return false;
    }
  }

  async verifyChallenge(
    id: bigint,
  ): Promise<{ success: boolean } | { error: string }> {
    try {
      const actor = this.getActor();
      const result = await actor.verifyChallenge(id);
      return result;
    } catch (error) {
      console.error("Failed to verify challenge:", error);
      return { error: "Verification failed" };
    }
  }

  async getChallengeStatus(
    id: bigint,
  ): Promise<
    { pending: null } | { verified: null } | { failed: string } | null
  > {
    try {
      const actor = this.getActor();
      const result = await actor.getChallengeStatus(id);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to get challenge status:", error);
      return null;
    }
  }

  async isApifyBearerTokenSet(): Promise<boolean> {
    try {
      const actor = this.getActor();
      const result = await actor.isApifyBearerTokenSet();
      return result;
    } catch (error) {
      console.error("Failed to check Apify Bearer Token status:", error);
      return false;
    }
  }

  async getApifyBearerTokenMasked(): Promise<string | null> {
    try {
      const actor = this.getActor();
      const result = await actor.getApifyBearerTokenMasked();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to get masked Apify Bearer Token:", error);
      return null;
    }
  }

  async setApifyBearerToken(token: string): Promise<void> {
    try {
      const actor = this.getActor();
      await actor.setApifyBearerToken(token);
    } catch (error) {
      console.error("Failed to set Apify Bearer Token:", error);
      throw error;
    }
  }

  async setApifyCookies(cookies: string): Promise<void> {
    try {
      const actor = this.getActor();
      await actor.setApifyCookies(cookies);
    } catch (error) {
      console.error("Failed to set Apify Cookies:", error);
      throw error;
    }
  }

  async getUserPoints(): Promise<{
    challengePoints: bigint;
    followerPoints: bigint;
    totalPoints: bigint;
  }> {
    console.log("🔍 DEBUG ChallengeService: getUserPoints called");
    console.log(
      "🔍 DEBUG ChallengeService: Identity available:",
      !!this.identity,
    );
    console.log(
      "🔍 DEBUG ChallengeService: Principal:",
      this.identity?.getPrincipal().toString(),
    );
    try {
      console.log("🔍 DEBUG ChallengeService: Getting actor...");
      const actor = this.getActor();
      console.log(
        "🔍 DEBUG ChallengeService: Calling actor.getUserPoints()...",
      );
      const result = await actor.getUserPoints();
      console.log(
        "🔍 DEBUG ChallengeService: actor.getUserPoints() returned:",
        result,
      );
      return result;
    } catch (error) {
      console.error(
        "🔍 DEBUG ChallengeService: Failed to get user points:",
        error,
      );
      const err = error as Error;
      console.error("🔍 DEBUG ChallengeService: Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      return {
        challengePoints: 0n,
        followerPoints: 0n,
        totalPoints: 0n,
      };
    }
  }

  async getLeaderboard(): Promise<
    Array<{
      principal: any;
      challengePoints: bigint;
      followerPoints: bigint;
      totalPoints: bigint;
      username: string | null;
      name: string | null;
    }>
  > {
    try {
      const actor = this.getActor();
      const result = await actor.getLeaderboard();
      return result;
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      return [];
    }
  }

  async getAdmin(): Promise<any | null> {
    try {
      const actor = this.getActor();
      const result = await actor.getAdmin();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to get admin:", error);
      return null;
    }
  }

  async setAdmin(): Promise<void> {
    try {
      const actor = this.getActor();
      await actor.setAdmin();
    } catch (error) {
      console.error("Failed to set admin:", error);
      throw error;
    }
  }

  async getSystemData(): Promise<{
    challenges: Array<{
      id: bigint;
      description: string;
      challengeType: { follows: { user: string } };
      points: bigint;
    }>;
    users: Array<{
      principal: any;
      username: string | null;
      name: string | null;
      provider: { github: null } | { twitter: null } | { discord: null } | { google: null } | { auth0: null } | { zitadel: null } | { x: null };
      followersCount: bigint | null;
      cacheValid: boolean;
      challengePoints: bigint;
      followerPoints: bigint;
      totalPoints: bigint;
      completedChallenges: Array<{
        challengeId: bigint;
        status: { verified: null } | { pending: null } | { failed: string };
        points: bigint;
      }>;
    }>;
  }> {
    try {
      const actor = this.getActor();
      const result = await actor.getSystemData();
      return result;
    } catch (error) {
      console.error("Failed to get system data:", error);
      throw error;
    }
  }

  async recalculateAllUserPoints(): Promise<{
    usersProcessed: bigint;
    totalPointsUpdated: bigint;
  }> {
    try {
      const actor = this.getActor();
      const result = await actor.recalculateAllUserPoints();
      return result;
    } catch (error) {
      console.error("Failed to recalculate user points:", error);
      throw error;
    }
  }
}
