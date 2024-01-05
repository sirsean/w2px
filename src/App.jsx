import { useState } from 'react'
import './App.css'

function HomePage() {
  return (
    <>
      <img src="/img/w2px.png" className="logo" alt="w2px logo" />
      <p>Moving from WETH to pxETH should be easy. <em>w2px</em> makes it easy.</p>
      <p>This contract will take your WETH, withdraw it into ETH, and deposit that ETH into Pirex. It's up to you whether you want pxETH back, or autocompound into apxETH.</p>
    </>
  )
}

function App() {
  return (
    <>
      <HomePage />
    </>
  )
}

export default App
