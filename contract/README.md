# w2px Contract

This contract will convert WETH into pxETH.

It depends on the WETH contract. It needs to call WETH.withdraw() in order to
convert WETH into the underlying ETH.

It then deposits that ETH into the Pirex contract, returning pxETH to the original caller. It is up to the caller whether they want to receive pxETH or
apxETH instead.

There is a small fee for this service. That's why you receive a tiny bit less
pxETH than the WETH you put in.

## Setup

Hardhat has rules about what version of Node you can use.

```shell
nvm use
```

## Usage

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deploy.js
```

## Verification

```shell
npx hardhat --network mainnet verify --constructor-args scripts/args.js 0x16DbF28Aa24678eCCe4dB7486b5061B2AF857FD0
```
