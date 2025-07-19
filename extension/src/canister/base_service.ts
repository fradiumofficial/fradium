import { CANISTER_HOST } from "@/lib/config";
import { HttpAgent } from "@dfinity/agent";

export const createAgent = async (): Promise<HttpAgent> => {
  const agent = new HttpAgent({
    host: CANISTER_HOST,
  });

  if (CANISTER_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  return agent;
};