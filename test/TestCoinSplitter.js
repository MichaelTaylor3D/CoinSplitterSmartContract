var CoinSplitter = artifacts.require("./CoinSplitter.sol");

contract('CoinSplitter', async (accounts) => {
  let instance;
  await CoinSplitter.new().then(function(res) { instance = CoinSplitter.at(res.address) })
  const addressStub = '0xf17f52151ebef6c7334fad080c5704d77216b732'

  // a lot of tests depend on this one so run this first
  describe('#clearAllAddr()', () => {
    it('sets the currentTotalWeight to 0', async () => {
      await instance.addSplitAddr(25, addressStub);

      let currentTotalWeight = Number(await instance.currentTotalWeight.call());
      
      expect(currentTotalWeight).to.equal(25);

      await instance.clearAllAddr();
      currentTotalWeight = Number(await instance.currentTotalWeight.call());

      expect(currentTotalWeight).to.equal(0);
    });

    it('sets the numCoins to 0', async () => {
      await instance.addSplitAddr(25, addressStub);
      await instance.addSplitAddr(25, addressStub);

      let currentNumCoins = Number(await instance.numCoins.call());
      
      expect(currentNumCoins).to.equal(2);

      await instance.clearAllAddr();
      currentNumCoins = Number(await instance.numCoins.call());

      expect(currentNumCoins).to.equal(0);
    });
  });

  describe('Initial State', () => {
    it('Expects numCoins to init at 0', async () => {
      const numCoins = Number(await instance.numCoins.call());

      expect(numCoins).to.equal(0);
    });
  });

  describe('#addSplitAddr()', () => {
    it('adds to the index of numCoins when address is added', async () => {
      const weight = 20;
      await instance.addSplitAddr(weight, addressStub);

      expect(Number(await instance.numCoins.call()),
        'numCoins was not incremented when address was added'
      ).to.equal(1);
    });
  })

  describe('#changeRequiredMinDeposit()', () => {

  });

  describe('#removeLastAddr()', () => {
    // Dependancies: addSplitAddr, clearAllAddr
    beforeEach(async () => {
      await instance.clearAllAddr();
      await instance.addSplitAddr(25, addressStub);
    });

    it('subtracts from the index in numCoins when a address is removed', async () => {
      expect(Number(await instance.numCoins.call()),
        'numCoins is 0 so can not be tested properly'
      ).to.not.equal(0);

      await instance.removeLastAddr();

      expect(Number(await instance.numCoins.call()),
        'Did not decrease index by 1 when removing address'
      ).to.equal(0);
    });
  });

  describe('#withdrawAll()', () => {
    it('sends all the funds in the contract to the owner', async () => {
      await web3.eth.sendTransaction({
        from: web3.eth.coinbase,
        to: instance.address,
        value: web3.toWei(1, 'ether')
      });

      let contractBalance = web3.fromWei(Number(web3.eth.getBalance(instance.address)), 'ether');

      expect(contractBalance).to.equal('1');

      await instance.withdrawlAll();

      contractBalance = web3.fromWei(Number(web3.eth.getBalance(instance.address)), 'ether');

      expect(contractBalance).to.equal('0');
    })
  });

  describe('#splitBalance', () => {
    beforeEach(async () => {
      await instance.clearAllAddr();
    });

    describe('fallback function', () => {
      it('should split balance if contract balance is at least the min Required deposit', async () => {
        await instance.addSplitAddr(50, '0x627306090abab3a6e1400e9345bc60c78a8bef57');
        await instance.addSplitAddr(50, '0xf17f52151ebef6c7334fad080c5704d77216b732');

        const deposit = Number(await instance.minDepositInWei.call());

        await web3.eth.sendTransaction({
          from: web3.eth.coinbase,
          to: instance.address,
          value: deposit
        });

        const contractBalance = Number(web3.eth.getBalance(instance.address));
      
        expect(contractBalance).to.equal(0); 
      });

      it('should not split balance if contract balence is less then the min req deposit', async () => {
        await instance.addSplitAddr(50, '0x627306090abab3a6e1400e9345bc60c78a8bef57');
        await instance.addSplitAddr(50, '0xf17f52151ebef6c7334fad080c5704d77216b732');

        const deposit = Number(await instance.minDepositInWei.call()) - 1000000;
   
        await web3.eth.sendTransaction({
          from: web3.eth.coinbase,
          to: instance.address,
          value: deposit
        });

        const contractBalance = Number(web3.eth.getBalance(instance.address));
      
        expect(contractBalance).to.equal(deposit); 
      });
    });

    it('if weights equal 100 then 100% of deposited eth should be sent', async () => {      
      await instance.addSplitAddr(25, '0x627306090abab3a6e1400e9345bc60c78a8bef57');
      await instance.addSplitAddr(25, '0xf17f52151ebef6c7334fad080c5704d77216b732');
      await instance.addSplitAddr(50, '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef');

      await web3.eth.sendTransaction({
        from: web3.eth.coinbase,
        to: instance.address,
        value: web3.toWei(1, 'ether')
      });

      const contractBalance = web3.fromWei(Number(web3.eth.getBalance(instance.address)), 'ether');
      
      expect(contractBalance).to.equal('0');  
    });

    it('weights equal 50 then 50% of deposited eth should be sent', async () => {
      await instance.addSplitAddr(25, '0x627306090abab3a6e1400e9345bc60c78a8bef57');
      await instance.addSplitAddr(25, '0xf17f52151ebef6c7334fad080c5704d77216b732');

      await web3.eth.sendTransaction({
        from: web3.eth.coinbase,
        to: instance.address,
        value: web3.toWei(1, 'ether')
      });

      const contractBalance = web3.fromWei(Number(web3.eth.getBalance(instance.address)), 'ether');

      expect(contractBalance).to.equal('0.5');
      
    });

    it('odd distributed weights equal 100 then 100% of deposited eth should be sent', async () => {
      await instance.addSplitAddr(1, '0x627306090abab3a6e1400e9345bc60c78a8bef57');
      await instance.addSplitAddr(23, '0xf17f52151ebef6c7334fad080c5704d77216b732');
      await instance.addSplitAddr(26, '0x5aeda56215b167893e80b4fe645ba6d5bab767de');
      await instance.addSplitAddr(50, '0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef');

      await web3.eth.sendTransaction({
        from: web3.eth.coinbase,
        to: instance.address,
        value: web3.toWei(1, 'ether')
      });

      const contractBalance = web3.fromWei(Number(web3.eth.getBalance(instance.address)), 'ether');

      expect(contractBalance).to.equal('0');      
    });
  });
});
