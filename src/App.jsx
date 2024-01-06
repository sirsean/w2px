import { useEffect, useState } from 'react'

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig, useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains'
import { fetchBalance } from '@wagmi/core'

import './App.css'
import WETH_ABI from './assets/WETH.json';

// make sure we're pointed at the right address
const W2PX_ADDRESS = '0x16DbF28Aa24678eCCe4dB7486b5061B2AF857FD0' // hardhat

// for local development only
const hardhat = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545/'] },
  },
}

// make sure we're connected to the right chain
const chains = [hardhat]
const projectId = '041ca440a691058adf974d4ac779975a'

const wagmiConfig = defaultWagmiConfig({ chains, projectId })

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'light',
})

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const PXETH_ADDRESS = '0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6'
const APXETH_ADDRESS = '0x9Ba021B0a9b958B5E75cE9f6dff97C7eE52cb3E6'

function WalletConnector() {
  return (
    <div className="WalletConnector">
      <h1>w2px</h1>
      <w3m-button />
    </div>
  )
}

function BalanceManager() {
  const { address } = useAccount();
  const [wethBalance, setWethBalance] = useState(null);
  const [pxethBalance, setPxethBalance] = useState(null);
  const [apxethBalance, setApxethBalance] = useState(null);
  useEffect(() => {
    if (!address) {
      return;
    }
    fetchBalance({
      address: address,
      token: WETH_ADDRESS,
    }).then(setWethBalance)
    fetchBalance({
      address: address,
      token: PXETH_ADDRESS,
    }).then(setPxethBalance)
    fetchBalance({
      address: address,
      token: APXETH_ADDRESS,
    }).then(setApxethBalance)
  }, [address])
  if (address) {
    return (
      <div className="BalanceManager">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WETH</td>
              <td>{wethBalance?.formatted}</td>
            </tr>
            <tr>
              <td>pxETH</td>
              <td>{pxethBalance?.formatted}</td>
            </tr>
            <tr>
              <td>apxETH</td>
              <td>{apxethBalance?.formatted}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

function ApprovalManager() {
  const { address } = useAccount();
  const [wethBalance, setWethBalance] = useState(null);
  const [ wethApproval, setWethApproval ] = useState(null);
  useEffect(() => {
    if (!address) {
      return;
    }
    fetchBalance({
      address: address,
      token: WETH_ADDRESS,
    }).then(setWethBalance)
  }, [address])
  useContractRead({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: 'allowance',
    args: [address, W2PX_ADDRESS],
    watch: true,
    onSuccess(data) {
      setWethApproval(data);
    },
    onError(error) {
      console.log(error);
    },
  }, [address])
  const { data: tx, isLoading, isSuccess, write } = useContractWrite({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: 'approve',
    args: [W2PX_ADDRESS, BigInt(2 ** 255 - 1)], // pretty much max int
  })
  const { data: receipt } = useWaitForTransaction({
    hash: tx?.hash,
    onSuccess(data) {
      console.log(data);
    },
  })
  if (address && wethApproval != null && wethBalance != null && wethApproval < wethBalance.value) {
    return (
      <div className="ApprovalManager">
        <p>In order for this to work, you must approve the contract to take your WETH.</p>
        <p>Current allowance: {formatUnits(wethApproval, 18)} WETH</p>
        {!isLoading && !isSuccess &&
          <button disabled={!write} onClick={() => write?.()}>Approve WETH</button>}
        {receipt &&
          <>
            <a target="_blank" href={`https://etherscan.io/tx/${receipt.transactionHash}`}>View on Etherscan</a>
          </>}
      </div>
    );
  }
}

function HomePage() {
  return (
    <>
      <WalletConnector />
      <img src="/img/w2px.png" className="logo" alt="w2px logo" />
      <div className="content">
        <p>Moving from WETH to pxETH should be easy. I mean, it's already pretty easy, two transactions. <em>w2px</em> does it in one, which is way easier.</p>
        <p>(WETH to pxETH ... or w2px for short. Get it?)</p>
        <p>And if you want to use it from a smart contract so that you can auto-convert WETH into pxETH to send along to its ultimate destination, well, that's also easy.</p>
        <p>This contract will take your WETH, withdraw it into ETH, and deposit that ETH into Pirex. It's up to you whether you want pxETH back, or autocompound into apxETH.</p>
        <BalanceManager />
        <ApprovalManager />
        <hr />
        <ul>
          // TODO: fill out these links
          <li>Github</li>
          <li>Etherscan</li>
        </ul>
      </div>
    </>
  )
}

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <HomePage />
    </WagmiConfig>
  )
}

export default App
