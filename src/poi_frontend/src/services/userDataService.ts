import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  idlFactory,
  _SERVICE,
  User,
} from "../../../declarations/user_data_backend";

const CANISTER_ID = "fhzgg-waaaa-aaaah-aqzvq-cai";

export class UserDataService {
  private actor: _SERVICE | null = null;

  constructor(private agent: HttpAgent) {}

  private async getActor(): Promise<_SERVICE> {
    if (!this.actor) {
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: CANISTER_ID,
      });
    }
    return this.actor;
  }

  async getUser(principal: Principal, origin: string): Promise<User | null> {
    try {
      const actor = await this.getActor();
      const result = await actor.getUser({ principal, origin });
      return result[0] || null;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  }
}
