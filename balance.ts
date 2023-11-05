import { BigNumber, ethers } from "ethers";
import { ETH, Token, USDC } from "@/tokens";
import ERC20_API from "./abi/ERC20.json";

export async function getBalance(
  provider: ethers.providers.Web3Provider,
  tokenAddress: string,
  userAddress: string
) {
  // initialize factory contract
  const ERC20_CONTRACT = new ethers.Contract(tokenAddress, ERC20_API, provider);
  const tokenBalance = await ERC20_CONTRACT.balanceOf(userAddress);

  return tokenBalance;
}
