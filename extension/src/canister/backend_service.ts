import { Actor, type ActorSubclass } from "@dfinity/agent";
import { idlFactory } from "../../../src/declarations/backend";
import type { _SERVICE } from "../../../src/declarations/backend/backend.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getBackendActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  const agent = await createAgent();
  const canisterId = getCanisterId('backend');

  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  return actor;
};

export const clearBackendActor = (): void => {
  actor = null;
};

// Helper functions for common backend operations
export const getUserProfile = async (address: string) => {
  const actor = await getBackendActor();
  return await actor.analyze_address(address);
};