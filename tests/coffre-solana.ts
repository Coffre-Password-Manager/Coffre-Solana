import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as assert from "assert";
import { CoffreSolana } from "../target/types/coffre_solana";

describe("coffre-solana", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.CoffreSolana as Program<CoffreSolana>;

  const savePassword = async (owner, name, path, ciphertext) => {
    const password = anchor.web3.Keypair.generate();
    await program.rpc.savePassword(name, path, ciphertext, {
      accounts: {
        password: password.publicKey,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [password, owner],
    });
    return password
  }

  it('can save a new password', async () => {
    const owner = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(owner.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    const password = await savePassword(owner, 'name', 'path', 'ciphertext')
    const passwordAccount = await program.account.password.fetch(password.publicKey);
    assert.equal(passwordAccount.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(passwordAccount.name, 'name');
    assert.equal(passwordAccount.path, 'path');
    assert.equal(passwordAccount.ciphertext, 'ciphertext');
  });

  it('can update a password', async () => {
    const owner = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(owner.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    const password = await savePassword(owner, 'old','oldPath', 'oldCiphertext');
    const passwordAccount = await program.account.password.fetch(password.publicKey);
    assert.equal(passwordAccount.name, 'old');
    assert.equal(passwordAccount.path, 'oldPath');
    assert.equal(passwordAccount.ciphertext, 'oldCiphertext');

    await program.rpc.updatePassword('new','newPath', 'newCiphertext', {
      accounts: {
        password: password.publicKey,
        owner: owner.publicKey,
      },
      signers: [owner]
    });
    const updatedTweetAccount = await program.account.password.fetch(password.publicKey);
    assert.equal(updatedTweetAccount.name, 'new');
    assert.equal(updatedTweetAccount.path, 'newPath');
    assert.equal(updatedTweetAccount.ciphertext, 'newCiphertext');
  });

  it('can delete a password', async () => {
    const owner = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(owner.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    const password = await savePassword(owner, 'name','path', 'ciphertext');
    await program.rpc.deletePassword({
      accounts: {
        password: password.publicKey,
        owner: owner.publicKey,
      },
      signers: [owner]
    });
    const passwordAccount = await program.account.password.fetchNullable(password.publicKey);
    assert.ok(passwordAccount === null);
  });

  it("cannot delete someone else's password", async () => {
    const owner = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(owner.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(signature);

    const password = await savePassword(owner, 'name','path', 'ciphertext');
    try {
      await program.rpc.deletePassword({
        accounts: {
          password: password.publicKey,
          owner: anchor.web3.Keypair.generate().publicKey,
        },
        signers: [owner]
      });
      assert.fail("We were able to delete someone else's password.");
    } catch (error) {
      const passwordAccount = await program.account.password.fetch(password.publicKey);
      assert.equal(passwordAccount.name, 'name');
      assert.equal(passwordAccount.path, 'path');
      assert.equal(passwordAccount.ciphertext, 'ciphertext');
    }
  });
});
