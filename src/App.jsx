import { useState } from 'react'

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { arbitrum, mainnet } from 'viem/chains'

import './App.css'

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

const projectId = '041ca440a691058adf974d4ac779975a'
const chains = [mainnet]

const wagmiConfig = defaultWagmiConfig({ chains, projectId })

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'light',
})

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

function WalletConnector() {
  return (
    <div className="WalletConnector">
      <h1>w2px</h1>
      <w3m-button />
    </div>
  )
}

function HomePage() {
  return (
    <>
      <WalletConnector />
      <img src="/img/w2px.png" className="logo" alt="w2px logo" />
      <p>Moving from WETH to pxETH should be easy. <em>w2px</em> makes it easy.</p>
      <p>This contract will take your WETH, withdraw it into ETH, and deposit that ETH into Pirex. It's up to you whether you want pxETH back, or autocompound into apxETH.</p>
      <ul>
        // TODO: fill out these links
        <li>Github</li>
        <li>Etherscan</li>
      </ul>
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
