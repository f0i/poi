import { createActor, canisterId } from "../../../declarations/poi_backend";
import { Identity } from "@dfinity/agent";

export type ChallengeType = { follows: { user: string } };

export interface Challenge {
  id: bigint;
  description: string;
  challengeType: ChallengeType;
}

export class ChallengeService {
  private actor: any = null;

  constructor(private identity?: Identity) {}

  private getActor() {
    if (!this.actor) {
      if (!canisterId) {
        throw new Error("Backend canister not available. Make sure CANISTER_ID_POI_BACKEND environment variable is set.");
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
  ): Promise<bigint | null> {
    try {
      const actor = this.getActor();
      const result = await actor.createChallenge(description, challengeType);
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
  ): Promise<boolean> {
    try {
      const actor = this.getActor();
      const result = await actor.updateChallenge(
        id,
        description,
        challengeType,
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

  async verifyChallenge(id: bigint): Promise<{ success: boolean } | { error: string }> {
    try {
      const actor = this.getActor();
      const result = await actor.verifyChallenge(id);
      return result;
    } catch (error) {
      console.error("Failed to verify challenge:", error);
      return { error: "Verification failed" };
    }
  }

  async getChallengeStatus(id: bigint): Promise<{ pending: null } | { verified: null } | { failed: string } | null> {
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
}

