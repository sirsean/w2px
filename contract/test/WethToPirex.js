const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const WETH_ABI = require("./abi/WETH.json");
const ERC20_ABI = require("./abi/ERC20.json");

// a test address that must hold 1 WETH in order for these tests to pass :-o
const sirsean = "0x560EBafD8dB62cbdB44B50539d65b48072b98277";

const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const pirexEthAddress = "0xD664b74274DfEB538d9baC494F3a4760828B02b0";
const pxEthAddress = "0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6";
const apxEthAddress = "0x9Ba021B0a9b958B5E75cE9f6dff97C7eE52cb3E6";

describe("WethToPirex", function () {
    async function deploy() {
        const [ deployer, feeRecipient, extraWallet ] = await ethers.getSigners();
        const weth = new ethers.Contract(wethAddress, WETH_ABI, ethers.provider);
        const pxEth = new ethers.Contract(pxEthAddress, ERC20_ABI, ethers.provider);
        const apxEth = new ethers.Contract(apxEthAddress, ERC20_ABI, ethers.provider);
        const WethToPirex = await ethers.getContractFactory("WethToPirex");
        const wethToPirex = await WethToPirex.deploy(10, wethAddress, pirexEthAddress);
        return { weth, pxEth, apxEth, wethToPirex, deployer, feeRecipient, extraWallet };
    }

    describe("ownership", () => {
        it("should be owned by the deployer", async () => {
            const { deployer, wethToPirex } = await loadFixture(deploy);
            expect(await wethToPirex.owner()).to.equal(deployer.address);
        })
    })

    describe("fees", () => {
        it("should start with default feeRecipient", async () => {
            const { wethToPirex, deployer } = await loadFixture(deploy);
            expect(await wethToPirex.feeRecipient()).to.equal(deployer.address);
        })

        it("should allow you to update the feeRecipient", async () => {
            const { wethToPirex } = await loadFixture(deploy);
            await wethToPirex.setFeeRecipient(sirsean);
            expect(await wethToPirex.feeRecipient()).to.equal(sirsean);
        })

        it("should start with the default fee", async () => {
            const { wethToPirex } = await loadFixture(deploy);
            expect(await wethToPirex.fee()).to.equal(10);
        })

        it("should allow you to update the fee", async () => {
            const { wethToPirex } = await loadFixture(deploy);
            await wethToPirex.setFee(20);
            expect(await wethToPirex.fee()).to.equal(20);
        })
    })

    describe("convert", () => {
        it("cannot convert 0 WETH", async () => {
            const { wethToPirex } = await loadFixture(deploy);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            expect(wethToPirex.connect(signer).convert(sirsean, 0, false)).to.be.revertedWith("amount must be greater than 0");
        })

        it("cannot convert if WETH is not approved", async () => {
            const { wethToPirex } = await loadFixture(deploy);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            expect(wethToPirex.connect(signer).convert(sirsean, ethers.parseEther("1"), false)).to.be.reverted;
        })

        it("can convert WETH to pxETH", async () => {
            const { wethToPirex, feeRecipient, weth, pxEth, apxEth } = await loadFixture(deploy);
            await wethToPirex.setFeeRecipient(feeRecipient.address);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            
            // WETH approval
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(0);
            await weth.connect(signer).approve(wethToPirex.target, ethers.parseEther("1"));
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(ethers.parseEther("1"));

            // initial balances
            const signerOriginalWethBalance = await weth.balanceOf(signer.address);
            const signerOriginalPxEthBalance = await pxEth.balanceOf(signer.address);
            const feeRecipientOriginalApxEthBalance = await apxEth.balanceOf(feeRecipient.address);

            // WETH -> pxETH
            await wethToPirex.connect(signer).convert(signer.address, ethers.parseEther("1"), false)

            // signer's WETH balance has gone down
            expect(await weth.balanceOf(signer.address)).to.equal(signerOriginalWethBalance - ethers.parseEther("1"));

            // signer's pxETH balance has gone up
            const signerNewPxEthBalance = await pxEth.balanceOf(signer.address);
            expect(signerNewPxEthBalance).to.be.above(signerOriginalPxEthBalance);
            const signerPxEthReceived = signerNewPxEthBalance - signerOriginalPxEthBalance;
            // received 99.9% of the original
            expect(signerPxEthReceived).to.equal(ethers.parseEther("0.999"));

            // feeRecipient has apxETH
            const feeRecipientNewApxEthBalance = await apxEth.balanceOf(feeRecipient.address);
            expect(feeRecipientNewApxEthBalance).to.be.above(feeRecipientOriginalApxEthBalance);
        })

        it("can convert WETH to apxETH", async () => {
            const { wethToPirex, feeRecipient, weth, pxEth, apxEth } = await loadFixture(deploy);
            await wethToPirex.setFeeRecipient(feeRecipient.address);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            
            // WETH approval
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(0);
            await weth.connect(signer).approve(wethToPirex.target, ethers.parseEther("1"));
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(ethers.parseEther("1"));

            // initial balances
            const signerOriginalWethBalance = await weth.balanceOf(signer.address);
            const signerOriginalPxEthBalance = await pxEth.balanceOf(signer.address);
            const signerOriginalApxEthBalance = await apxEth.balanceOf(signer.address);
            const feeRecipientOriginalApxEthBalance = await apxEth.balanceOf(feeRecipient.address);

            // WETH -> apxETH
            await wethToPirex.connect(signer).convert(signer.address, ethers.parseEther("1"), true)

            // signer's WETH balance has gone down
            expect(await weth.balanceOf(signer.address)).to.equal(signerOriginalWethBalance - ethers.parseEther("1"));

            // signer's pxETH balance is unchanged
            const signerNewPxEthBalance = await pxEth.balanceOf(signer.address);
            expect(signerNewPxEthBalance).to.equal(signerOriginalPxEthBalance);

            // signer's apxETH balance has gone up
            const signerNewApxEthBalance = await apxEth.balanceOf(signer.address);
            expect(signerNewApxEthBalance).to.be.above(signerOriginalApxEthBalance);

            // feeRecipient has apxETH
            const feeRecipientNewApxEthBalance = await apxEth.balanceOf(feeRecipient.address);
            expect(feeRecipientNewApxEthBalance).to.be.above(feeRecipientOriginalApxEthBalance);
        })

        it("can convert the sender's WETH into a different receiver's pxETH", async () => {
            const { wethToPirex, feeRecipient, extraWallet, weth, pxEth, apxEth } = await loadFixture(deploy);
            await wethToPirex.setFeeRecipient(feeRecipient.address);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            
            // WETH approval
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(0);
            await weth.connect(signer).approve(wethToPirex.target, ethers.parseEther("1"));
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(ethers.parseEther("1"));

            // initial balances
            const signerOriginalWethBalance = await weth.balanceOf(signer.address);
            const signerOriginalPxEthBalance = await pxEth.balanceOf(signer.address);
            const signerOriginalApxEthBalance = await apxEth.balanceOf(signer.address);
            const extraWalletOriginalPxEthBalance = await pxEth.balanceOf(extraWallet.address);
            const feeRecipientOriginalApxEthBalance = await apxEth.balanceOf(feeRecipient.address);

            // WETH -> pxETH
            await wethToPirex.connect(signer).convert(extraWallet.address, ethers.parseEther("1"), false)

            // signer's WETH balance has gone down
            expect(await weth.balanceOf(signer.address)).to.equal(signerOriginalWethBalance - ethers.parseEther("1"));

            // signer's pxETH balance is unchanged
            const signerNewPxEthBalance = await pxEth.balanceOf(signer.address);
            expect(signerNewPxEthBalance).to.equal(signerOriginalPxEthBalance);

            // signer's apxETH balance is unchanged
            const signerNewApxEthBalance = await apxEth.balanceOf(signer.address);
            expect(signerNewApxEthBalance).to.equal(signerOriginalApxEthBalance);

            // extra wallet's pxETH balance has gone up
            const extraWalletNewPxEthBalance = await pxEth.balanceOf(extraWallet.address);
            expect(extraWalletNewPxEthBalance).to.be.above(extraWalletOriginalPxEthBalance);
            const extraWalletPxEthReceived = extraWalletNewPxEthBalance - extraWalletOriginalPxEthBalance;
            // received 99.9% of the original
            expect(extraWalletPxEthReceived).to.equal(ethers.parseEther("0.999"));

            // feeRecipient has apxETH
            const feeRecipientNewApxEthBalance = await apxEth.balanceOf(feeRecipient.address);
            expect(feeRecipientNewApxEthBalance).to.be.above(feeRecipientOriginalApxEthBalance);
        })

        it("still works when the fee is set to zero", async () => {
            const { wethToPirex, feeRecipient, weth, pxEth, apxEth } = await loadFixture(deploy);
            await wethToPirex.setFeeRecipient(feeRecipient.address);
            await wethToPirex.setFee(0);
            const signer = await ethers.getImpersonatedSigner(sirsean);
            
            // WETH approval
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(0);
            await weth.connect(signer).approve(wethToPirex.target, ethers.parseEther("1"));
            expect(await weth.allowance(signer.address, wethToPirex.target)).to.equal(ethers.parseEther("1"));

            // initial balances
            const signerOriginalWethBalance = await weth.balanceOf(signer.address);
            const signerOriginalPxEthBalance = await pxEth.balanceOf(signer.address);
            const feeRecipientOriginalApxEthBalance = await apxEth.balanceOf(feeRecipient.address);

            // WETH -> pxETH
            await wethToPirex.connect(signer).convert(signer.address, ethers.parseEther("1"), false)

            // signer's WETH balance has gone down
            expect(await weth.balanceOf(signer.address)).to.equal(signerOriginalWethBalance - ethers.parseEther("1"));

            // signer's pxETH balance has gone up
            const signerNewPxEthBalance = await pxEth.balanceOf(signer.address);
            expect(signerNewPxEthBalance).to.be.above(signerOriginalPxEthBalance);
            const signerPxEthReceived = signerNewPxEthBalance - signerOriginalPxEthBalance;
            // received 100% of the original
            expect(signerPxEthReceived).to.equal(ethers.parseEther("1"));

            // feeRecipient has NOT received apxETH
            const feeRecipientNewApxEthBalance = await apxEth.balanceOf(feeRecipient.address);
            expect(feeRecipientNewApxEthBalance).to.equal(feeRecipientOriginalApxEthBalance);
        })
    })
})