import { useEffect, useState } from 'react'

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig, useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains'
import { fetchBalance } from '@wagmi/core'

import './App.css'
import WETH_ABI from './assets/WETH.json';
import W2PX_ABI from './assets/WethToPirex.json';

// make sure we're pointed at the right address
//const W2PX_ADDRESS = '0x16DbF28Aa24678eCCe4dB7486b5061B2AF857FD0' // hardhat
const W2PX_ADDRESS = '0x16DbF28Aa24678eCCe4dB7486b5061B2AF857FD0' // mainnet

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
//const chains = [hardhat]
const chains = [mainnet]
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

function bigIntMin(...args) {
  if (args.length === 0) {
      throw new TypeError('bigIntMin requires at least one argument.');
  }

  let minValue = args[0];
  for (let i = 1; i < args.length; i++) {
      if (args[i] < minValue) {
          minValue = args[i];
      }
  }
  return minValue;
}

function WalletConnector() {
  return (
    <div className="WalletConnector">
      <h1>w2px</h1>
      <w3m-button />
    </div>
  )
}

function BalanceManager({ wethBalance, pxethBalance, apxethBalance }) {
  if (wethBalance || pxethBalance || apxethBalance) {
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

function ApprovalManager({ wethBalance, wethApproval }) {
  const { address } = useAccount();
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

function Converter({ wethBalance, wethApproval }) {
  const { address } = useAccount();
  const { data: tx, isLoading, isSuccess, write } = useContractWrite({
    address: W2PX_ADDRESS,
    abi: W2PX_ABI,
    functionName: 'convert',
  })
  const { data: receipt } = useWaitForTransaction({
    hash: tx?.hash,
    onSuccess(data) {
      console.log(data);
    },
  })
  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const receiver = formData.get('receiver');
    const weth = formData.get('weth');
    const shouldCompound = formData.get('shouldCompound') === 'true';
    if (write) {
      write({ args: [receiver, parseUnits(weth, 18), shouldCompound] });
    }
  }
  if (!address || wethBalance == null || wethApproval == null || wethApproval == 0 || wethBalance.value == 0) {
    return null;
  }
  return (
    <div className="Converter">
      <h2>Convert your WETH to pxETH</h2>
      {!isLoading && !isSuccess &&
        <form onSubmit={onSubmit}>
          <input type="text" name="weth" defaultValue={formatUnits(bigIntMin(wethApproval, wethBalance?.value), 18)} />
          <span>WETH -&gt;</span>
          <select name="shouldCompound">
            <option value="false">pxETH</option>
            <option value="true">apxETH</option>
          </select>
          <button type="submit">Convert</button>
          <br />
          Receiver:
          <input type="text" className="address" name="receiver" defaultValue={address} />
        </form>}
      {isLoading && <p>Signing...</p>}
      {receipt &&
        <>
          <a target="_blank" href={`https://etherscan.io/tx/${receipt.transactionHash}`}>View on Etherscan</a>
        </>}
    </div>
  )
}

function DataFetcher({ setWethBalance, setPxethBalance, setApxethBalance, setWethApproval }) {
  const { address } = useAccount();
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
  useContractRead({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: 'allowance',
    args: [address, W2PX_ADDRESS],
    watch: true,
    onSuccess: setWethApproval,
    onError(error) {
      console.log(error);
    },
  }, [address])
  return null;
}

function HomePage() {
  const [wethBalance, setWethBalance] = useState(null);
  const [pxethBalance, setPxethBalance] = useState(null);
  const [apxethBalance, setApxethBalance] = useState(null);
  const [wethApproval, setWethApproval] = useState(null);
  return (
    <>
      <DataFetcher
        setWethBalance={setWethBalance}
        setPxethBalance={setPxethBalance}
        setApxethBalance={setApxethBalance}
        setWethApproval={setWethApproval}
        />
      <WalletConnector />
      <img src="/img/w2px.png" className="logo" alt="w2px logo" />
      <div className="content">
        <p>Moving from WETH to pxETH should be easy. I mean, it's already pretty easy, two transactions. <em>w2px</em> does it in one, which is way easier.</p>
        <p>(WETH to pxETH ... or w2px for short. Get it?)</p>
        <p>And if you want to use it from a smart contract so that you can auto-convert WETH into pxETH to send along to its ultimate destination, well, that's also easy.</p>
        <p>This contract will take your WETH, withdraw it into ETH, and deposit that ETH into Pirex. It's up to you whether you want pxETH back, or autocompound into apxETH.</p>
        <BalanceManager
          wethBalance={wethBalance}
          pxethBalance={pxethBalance}
          apxethBalance={apxethBalance}
          />
        <ApprovalManager
          wethBalance={wethBalance}
          wethApproval={wethApproval}
          />
        <Converter
          wethBalance={wethBalance}
          wethApproval={wethApproval}
          />
        <hr />
        <ul>
          <li><a target="_blank" href="https://github.com/sirsean/w2px">Github</a></li>
          <li><a target="_blank" href={`https://etherscan.io/address/${W2PX_ADDRESS}`}>Etherscan</a></li>
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
