import { createActor, canisterId } from "../../../declarations/poi_backend";
import type { User } from "../../../declarations/poi_backend/poi_backend.did";
import { Identity } from "@dfinity/agent";

export class UserDataService {
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

  async getUser(origin: string): Promise<User | null> {
    try {
      const actor = this.getActor();
      const result = await actor.getUserData(origin);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  }

  async refreshUserData(origin: string): Promise<User | null> {
    try {
      const actor = this.getActor();
      const result = await actor.refreshUserData(origin);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  }

  async getCachedUserData(): Promise<User | null> {
    try {
      const actor = this.getActor();
      const result = await actor.getCachedUserData();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to get cached user data:", error);
      return null;
    }
  }
}
