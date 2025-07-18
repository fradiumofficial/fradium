import { CANISTER_HOST, getCanisterId } from "@/lib/config";
import { Actor, HttpAgent, type ActorSubclass } from "@dfinity/agent";
import { idlFactory, type _SERVICE } from "../../../src/declarations/ransomware_detector/ransomware_detector.did";

let actor: ActorSubclass<_SERVICE>;

export const createAgent =  async (): Promise<HttpAgent> => {
  const agent = new HttpAgent({
    host: CANISTER_HOST,
  })

  if (CANISTER_HOST.includes('127.0.0.1')) {
		await agent.fetchRootKey();
	}

	return agent;
}

export const getActor = async (): Promise<ActorSubclass<_SERVICE>> => {
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
}