const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const provider = ganache.provider();
const web3 = new Web3(provider);

const compiledDateApp = require("../client/src/ethereum/build/DateApp.json.js");

let accounts;
let dateApp;
let dateAppAddress;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  dateApp = await new web3.eth.Contract(JSON.parse(compiledDateApp.interface))
    .deploy({ data: compiledDateApp.bytecode })
    .send({ from: accounts[1], gas: "3000000" }); // gas we want to spend to deploy
  dateApp.setProvider(provider);
});

describe("Create some profiles", () => {
  let merchant = "0x79d10fFF04f8436C971d65c1F3849CE350ed342A";

  it("THIS IS", async () => {});

  it("Create one profile", async () => {
    await dateApp.methods.createProfile(25, "860-471-5009", merchant).send({
      from: accounts[0],
      gas: "1000000",
    });

    const profiles = await dateApp.methods.getProfiles().call();
    assert.equal(profiles.length, 1);
  });

  it("Create two profiles", async () => {
    await dateApp.methods.createProfile(28, "860-471-5009", merchant).send({
      from: accounts[0],
      gas: "1000000",
    });

    await dateApp.methods.createProfile(30, "860-471-5009", merchant).send({
      from: accounts[1],
      gas: "1000000",
    });

    await dateApp.methods.createProfile(32, "860-471-5009", merchant).send({
      from: accounts[2],
      gas: "1000000",
    });

    const profiles = await dateApp.methods.getProfiles().call();
    assert.equal(profiles.length, 3);
  });
});

describe("Make two like each other", () => {
  it("Make two like each other", async () => {
    let merchant = "0x79d10fFF04f8436C971d65c1F3849CE350ed342A";

    await dateApp.methods.createProfile(25, "860-471-5009", merchant).send({
      from: accounts[1],
      gas: "1000000",
    });
    await dateApp.methods.createProfile(30, "860-471-5000", merchant).send({
      from: accounts[2],
      gas: "1000000",
    });

    await dateApp.methods.likeProfile(accounts[1]).send({
      from: accounts[2],
      gas: "1000000",
    });

    try {
      await dateApp.methods.getNumber(accounts[1], accounts[2]).call();
      assert(false);
    } catch (err) {
      assert(true);
    }

    await dateApp.methods.likeProfile(accounts[2]).send({
      from: accounts[1],
      gas: "1000000",
    });

    // try to get the number now

    const isMatch = await dateApp.methods
      .isMatch(accounts[1], accounts[2])
      .call();
    assert(isMatch);

    try {
      const number = await dateApp.methods
        .getNumber(accounts[1], accounts[2])
        .call();
      assert(true);
    } catch (err) {
      assert(false);
    }

    try {
      const number = await dateApp.methods
        .getNumber(accounts[2], accounts[1])
        .call();
      assert(true);
    } catch (err) {
      assert(false);
    }

    try {
      const number = await dateApp.methods
        .getNumber(accounts[3], accounts[1])
        .call();
      assert(false);
    } catch (err) {
      assert(true);
    }
  });

  it("Payments", async () => {
    let merchant = "0x79d10fFF04f8436C971d65c1F3849CE350ed342A";

    await dateApp.methods.createProfile(25, "860-471-5009", merchant).send({
      from: accounts[1],
      gas: "1000000",
    });

    await dateApp.methods.createProfile(30, "860-471-5000", merchant).send({
      from: accounts[2],
      gas: "1000000",
    });

    await dateApp.methods.createProfile(35, "232-6136-860", merchant).send({
      from: accounts[3],
      gas: "1000000",
    });

    // ***************************************************

    await dateApp.methods.likeProfile(accounts[2]).send({
      from: accounts[1],
      gas: "1000000",
    });

    await dateApp.methods.likeProfile(accounts[1]).send({
      from: accounts[2],
      gas: "1000000",
    });

    await dateApp.methods.likeProfile(accounts[3]).send({
      from: accounts[2],
      gas: "1000000",
    });

    let isMatch = await dateApp.methods
      .isMatch(accounts[1], accounts[2])
      .call();
    assert(isMatch);

    isMatch = await dateApp.methods.isMatch(accounts[2], accounts[3]).call();
    assert(!isMatch);

    // accounts 2 is trying to get account 1's number
    try {
      let number = await dateApp.methods
        .getNumber(accounts[1], accounts[2])
        .call();
      assert(true);
      console.log("NUMBER IS: ", number);
    } catch (err) {
      assert(false);
    }

    try {
      let number = await dateApp.methods
        .getNumber(accounts[2], accounts[1])
        .call();
      assert(true);
      console.log("NUMBER IS: ", number);
    } catch (err) {
      assert(false);
    }

    try {
      let number = await dateApp.methods
        .getNumber(accounts[3], accounts[2])
        .call();
      assert(false);
    } catch (err) {
      assert(true);
    }

    // ***********************************
    // Payments

    // let balance = await web3.eth.getBalance(merchant);
    // console.log("Merchant account: ", balance);
    balance = await web3.eth.getBalance(accounts[1]);
    console.log("Merchant account: ", balance);

    await dateApp.methods.payDate(accounts[2]).send({
      from: accounts[1],
      value: web3.utils.toWei("2", "ether"),
    });

    balance = await web3.eth.getBalance(accounts[1]);
    console.log("Merchant account: ", balance);

    // now withdraw

    await dateApp.methods.withdraw(accounts[2]).send({
      from: accounts[1],
      gas: "1000000",
    });

    balance = await web3.eth.getBalance(accounts[1]);
    console.log("Merchant account: ", balance);
  });
});
