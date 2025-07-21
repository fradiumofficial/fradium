import { Actor, type ActorSubclass } from "@dfinity/agent";
import { idlFactory } from "../../../src/declarations/ransomware_detector";
import type { _SERVICE } from "../../../src/declarations/ransomware_detector/ransomware_detector.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getRansomwareActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  const agent = await createAgent();
  const canisterId = getCanisterId('ransomware_detector');

  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  return actor;
};

export const clearRansomwareActor = (): void => {
  actor = null;
};

// Helper functions for common operations
export const analyzeAddress = async (address: string) => {
  const actor = await getRansomwareActor();
  return await actor.analyze_address(address);
};