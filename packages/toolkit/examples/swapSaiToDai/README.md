Swap SAI to DAI in just one transaction
=======================================

Swapping SAI to DAI needs two transactions, one to approve the migration contract to spend your SAIs, and another to actually migrate from SAI to DAI.

We assume that the funds are already in an updated Agent app (**warning:** doing a swap with an agent app older than 11th September 2019 will cause the lose of funds because of the [Istanbul Fork](https://blog.aragon.org/istanbul-hard-fork-impact/)).

Assuming that the funds are already in an new Agent app, we can migrate them with two transactions:

```sh
$ npx aragon dao act <agent> 0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359 "approve(address,uint256)" 0xc73e0383f3aff3215e6f04b0331d58cecf0ab849 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff --environment aragon:mainnet
$ npx aragon dao act <agent> 0xc73e0383f3aff3215e6f04b0331d58cecf0ab849 "swapSaiToDai(uint256)" 1000000000000000000 --environment aragon:mainnet
```

We can encode those two transactions in just one EVM script using this tool. The syntax is as follows:

```
$ node index.js <dao> <voting> <agent> <amount>
```

The `amount` is the amount of SAIs you want to migrate and are inside the `agent`. SAIs have 18 decimals, so in order to migrate 1 SAI you have to pass it as 1000000000000000000 in the `amount` field.

The script should have created a new vote in your DAO. Open the voting app to see it.
