use anchor_lang::prelude::*;

declare_id!("B1CUk72aS11qXKiJCpgN4fBqrrJfVaAbDN7PjACpUt4f");

#[program]
pub mod coffre_solana {
    use super::*;
    pub fn save_password(ctx: Context<SavePassword>, name: String, path: String, ciphertext: String) -> Result<()> {
        let password: &mut Account<Password> = &mut ctx.accounts.password;
        let owner: &Signer = &ctx.accounts.owner;
        if name.chars().count() > 20 {
            return Err(ErrorCode::NameTooLong.into())
        }
        if path.chars().count() > 50 {
            return Err(ErrorCode::PathTooLong.into())
        }
        if ciphertext.chars().count() > 64 {
            return Err(ErrorCode::CiphertextTooLong.into())
        }
        password.owner = *owner.key;
        password.name = name;
        password.path = path;
        password.ciphertext = ciphertext;
        Ok(())
    }

    pub fn update_password(ctx: Context<UpdatePassword>, name: String, path: String, ciphertext: String) -> Result<()> {
        let password: &mut Account<Password> = &mut ctx.accounts.password;
        if name.chars().count() > 20 {
            return Err(ErrorCode::NameTooLong.into())
        }
        if path.chars().count() > 50 {
            return Err(ErrorCode::PathTooLong.into())
        }
        if ciphertext.chars().count() > 64 {
            return Err(ErrorCode::CiphertextTooLong.into())
        }
        password.name = name;
        password.path = path;
        password.ciphertext = ciphertext;
        Ok(())
    }

    pub fn delete_password(_ctx: Context<DeletePassword>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SavePassword<'info> {
    #[account(init, payer = owner, space = Password::LEN)]
    pub password: Account<'info, Password>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePassword<'info> {
    #[account(mut, has_one = owner)]
    pub password: Account<'info, Password>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeletePassword<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub password: Account<'info, Password>,
    pub owner: Signer<'info>,
}

#[account]
pub struct Password {
    pub owner: Pubkey,
    pub name: String,
    pub path: String,
    pub ciphertext: String,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_NAME_LENGTH: usize = 20 * 4;
const MAX_PATH_LENGTH: usize = 50 * 4;
const MAX_CIPHERTEXT_LENGTH: usize = 64 * 4;

impl Password {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + STRING_LENGTH_PREFIX + MAX_NAME_LENGTH
        + STRING_LENGTH_PREFIX + MAX_PATH_LENGTH
        + STRING_LENGTH_PREFIX + MAX_CIPHERTEXT_LENGTH;
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided name should be 20 characters long maximum.")]
    NameTooLong,
    #[msg("The provided path should be 50 characters long maximum.")]
    PathTooLong,
    #[msg("The provided ciphertext should be 64 characters long maximum.")]
    CiphertextTooLong,
}