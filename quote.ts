import { BigNumber, ethers } from "ethers";
import { ETH, Token, USDC } from "@/tokens";
import UNISWAP_V2_FACTORY_ABI from "./abi/UniswapV2Factory_abi.json";
import UNISWAP_V2_PAIR_ABI from "./abi/UniswapV2Pair_abi.json";

// NOTE: this uses UniswapV2. UniswapV3 has more liquidity and lower slippage but is more complex to implement.
// NOTE: assumed getQuote only takes integer since fromAmount type BigNumber

const PRECISION = 6;

export type Quote = {
  swapBalance: BigNumber;
  slippagePercent: number;
};

export async function getQuote(
  provider: ethers.providers.Web3Provider,
  fromToken: Token,
  toToken: Token,
  fromAmount: BigNumber
): Promise<Quote> {
  console.info(
    `Converting ${fromAmount.toString()} ${fromToken.symbol} to ${
      toToken.symbol
    }`
  );

  // initialize factory contract
  const UNISWAP_V2_FACTORY_ADDRESS =
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const UNISWAP_V2_FACTORY_CONTRACT = new ethers.Contract(
    UNISWAP_V2_FACTORY_ADDRESS,
    UNISWAP_V2_FACTORY_ABI,
    provider
  );

  // initialize specific pair contract
  const UNISWAP_V2_PAIR_ADDRESS = await UNISWAP_V2_FACTORY_CONTRACT.getPair(
    fromToken.address,
    toToken.address
  );
  const UNISWAP_V2_PAIR_CONTRACT = new ethers.Contract(
    UNISWAP_V2_PAIR_ADDRESS,
    UNISWAP_V2_PAIR_ABI,
    provider
  );

  // query information
  const tokenReserves = await UNISWAP_V2_PAIR_CONTRACT.getReserves();
  const token0Address = await UNISWAP_V2_PAIR_CONTRACT.token0();
  const token1Address = await UNISWAP_V2_PAIR_CONTRACT.token1();

  // format token reserves based on decimals
  let fromTokenReserve = (
    token0Address == ethers.utils.getAddress(fromToken.address)
      ? tokenReserves[0]
      : tokenReserves[1]
  ).div(BigNumber.from(10).pow(fromToken.decimals - PRECISION));
  let toTokenReserve = (
    token1Address == ethers.utils.getAddress(toToken.address)
      ? tokenReserves[1]
      : tokenReserves[0]
  ).div(BigNumber.from(10).pow(toToken.decimals - PRECISION));

  const marketPrice = toTokenReserve.toNumber() / fromTokenReserve.toNumber();

  // key slippage calculations values
  const constantProduct = fromTokenReserve.mul(toTokenReserve);
  const newFromTokenReserve = fromTokenReserve.add(
    fromAmount.mul(10 ** PRECISION)
  );
  const newToTokenReserve = constantProduct.div(newFromTokenReserve);

  const swapBalance = toTokenReserve.sub(newToTokenReserve);

  console.info(
    `Estimated swap balance: ${swapBalance.toNumber() / 10 ** PRECISION} ${
      toToken.symbol
    }`
  );

  const pricePaid =
    swapBalance.toNumber() / fromAmount.mul(10 ** PRECISION).toNumber();

  const slippagePercent = 1 - pricePaid / marketPrice;

  console.info(`Slippage: ${slippagePercent * 100}%`);

  return {
    swapBalance,
    slippagePercent,
  };
}
