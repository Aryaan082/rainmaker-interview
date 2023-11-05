"use client";
import Image from "next/image";
import { getQuote } from "@/quote";
import { USDC, WETH } from "@/tokens";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";

import SwapIcon from "../public/swap.png";

import "./page.css";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function Home() {
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [fromTokenValue, setFromTokenValue] = useState(0);
  const [toTokenValue, setToTokenValue] = useState(0);
  const [fromTokenBal, setFromTokenBal] = useState(0);
  const [toTokenBal, setToTokenBal] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [slippage, setSlippage] = useState(0);
  const [update, setUpdate] = useState(0);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(
    "0x0000000000000000000000"
  );

  let provider: any;

  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  const connectWallet = async () => {
    if (window.ethereum) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      setConnected(true);
      setWalletAddress(await signer.getAddress());
    }
  };

  const handleFromTokenValueChange = (e) =>
    setFromTokenValue(Number(e.target.value));
  const changeTokens = () => {
    if (fromToken == "ETH") {
      setFromToken("USDC");
      setToToken("ETH");
    } else {
      setFromToken("ETH");
      setToToken("USDC");
    }
  };

  useEffect(() => {
    async function updateQuote() {
      const quoteInfo = await getQuote(
        provider,
        fromToken == "ETH" ? WETH : USDC,
        toToken == "USDC" ? USDC : WETH,
        BigNumber.from(fromTokenValue ? fromTokenValue : 0)
      );

      const swapBalance = quoteInfo.swapBalance.toNumber() / 10 ** 6;
      setToTokenValue(swapBalance);
      setExchangeRate(
        parseFloat((swapBalance / fromTokenValue).toPrecision(4))
      );
      setSlippage(quoteInfo.slippagePercent * 100);
    }

    updateQuote();

    if (fromToken == "ETH") {
      setFromTokenBal();
    }
  }, [fromToken, fromTokenValue, update]);

  return (
    <main className="flex min-h-screen flex-col p-5">
      <div className="flex flex-row justify-between">
        <div className="text-2xl">Big Swapper</div>
        {connected ? (
          <div>Connected: {walletAddress.slice(0, 6)}</div>
        ) : (
          <button
            onClick={() => connectWallet()}
            className="text-black bg-white p-3 rounded-lg"
          >
            Connect Wallet
          </button>
        )}
      </div>
      <div className="flex justify-center">
        <div className="flex flex-col bg-[#161d22] w-[500px] p-5 rounded-lg">
          <div className="flex flex-col gap-2 bg-[#222f3d] p-3 rounded-md">
            <div className="flex flex-row justify-between">
              <div
                onClick={() => changeTokens()}
                className="text-xl px-2 py-1 border-[1px] border-[#476280] hover:bg-[#161d22] rounded-full hover:cursor-pointer"
              >
                {fromToken == "ETH" ? (
                  <div className="flex flex-row gap-2">
                    <Image src={WETH.icon} className="w-[24px]" alt=""></Image>
                    {fromToken}
                  </div>
                ) : (
                  <div className="flex flex-row gap-2">
                    <Image src={USDC.icon} className="w-[24px]" alt=""></Image>
                    {fromToken}
                  </div>
                )}
              </div>
              <input
                className="text-2xl text-white bg-transparent text-right no-spinners focus:outline-none"
                placeholder="0.00"
                type="number"
                value={fromTokenValue ? fromTokenValue : ""}
                onChange={(e) => handleFromTokenValueChange(e)}
              ></input>
            </div>
            <div className="text-sm">Balance: -</div>
          </div>
          <div className="flex justify-center p-5">
            <Image
              className="rotate-90 w-[20px] hover:cursor-pointer"
              onClick={() => changeTokens()}
              src={SwapIcon}
              alt=""
            ></Image>
          </div>
          <div className="flex flex-col gap-2 bg-[#222f3d] p-3 rounded-md">
            <div className="flex flex-row justify-between ">
              <div
                onClick={() => changeTokens()}
                className="text-xl px-2 py-1 border-[1px] border-[#476280] hover:bg-[#161d22] rounded-full hover:cursor-pointer"
              >
                {toToken == "USDC" ? (
                  <div className="flex flex-row gap-2">
                    <Image src={USDC.icon} className="w-[24px]" alt=""></Image>
                    {toToken}
                  </div>
                ) : (
                  <div className="flex flex-row gap-2">
                    <Image src={WETH.icon} className="w-[24px]" alt=""></Image>
                    {toToken}
                  </div>
                )}
              </div>
              <div className="text-2xl text-white text-right">
                {toTokenValue ? toTokenValue : "0.00"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-[#999cb3] py-4">
            <div className="flex flex-row justify-between">
              <div>Rate</div>
              <div>
                1 {fromToken} = {exchangeRate} {toToken}
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <div>Route</div>
              <div>Uniswap</div>
            </div>
            <div className="flex flex-row justify-between">
              <div>Speed</div>
              <div>~20 seconds</div>
            </div>
            <div className="flex flex-row justify-between">
              <div>Fees & Slippage</div>
              <div>{slippage ? slippage.toPrecision(4) + "%" : "-"}</div>
            </div>
          </div>
          <button
            onClick={() => setUpdate(update + 1)}
            className="bg-white py-2 text-black rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </main>
  );
}
