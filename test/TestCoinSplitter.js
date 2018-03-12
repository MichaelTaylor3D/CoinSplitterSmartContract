var CoinSplitter = artifacts.require("./CoinSplitter.sol");

contract('CoinSplitter', async (accounts) => {
  const instance = await CoinSplitter.deployed();

  describe('Initial State', () => {
    it('Expects numCoins to init at 0', async () => {
      const numCoins = Number(await instance.numCoins.call());

      assert.equal(numCoins, 0);
    });
  });

  describe('#addSplitAddr()', () => {
    it('adds to the index of numCoins when address is added', async () => {
      const weight = 20;
      const fakeAddress = 0x0000f;
      await instance.addSplitAddr(weight, fakeAddress);

      assert.equal(Number(await instance.numCoins.call()), 1,
        'numCoins was not incremented when address was added'
      )
    });
  })

  describe('#removeLastAddr()', () => {
    beforeEach(async () => {
      // this expects that these functions were already tested
      // So test this after these tests
      await instance.clearAllAddr();
      await instance.addSplitAddr(0, 0x000f);
    });

    it("subtracts from the index in numCoins when a address is removed", async () => {
      assert.notEqual(Number(await instance.numCoins.call()), 0, 
        "numCoins is 0 so can not be tested properly"
      );

      await instance.removeLastAddr();

      assert.equal(Number(await instance.numCoins.call()), 0,
        "Did not decrease index by 1 when removing address"
      );
    });
  });
});
