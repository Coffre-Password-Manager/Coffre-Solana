import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CoffreSolana } from "../target/types/coffre_solana";

describe("coffre-solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CoffreSolana as Program<CoffreSolana>;

});
