import { AbiItem } from 'web3-utils'
import web3EthAbi from 'web3-eth-abi'
var abiAragonAppProxy = require('@aragon/abis/os/abi/AppProxyBase.json')

export function checkSignatureCollisionsWithProxy(abi: AbiItem[]) {
    const appProxyAbi = abiAragonAppProxy.abi.filter(
        ({ type }: { [key: string]: string }) => type === 'function'
    )
    const collisions = findFunctionSignatureCollisions(abi, appProxyAbi)
    if (collisions.length > 0) {
        console.log(
            `WARNING: Collisions detected between the proxy and app contract ABI's.
        This is a potential security risk.
        Affected functions:`,
            JSON.stringify(collisions.map(entry => entry.name))
        )
    }
}

function findFunctionSignatureCollisions(abi1: AbiItem[], abi2: AbiItem[]) {
    const getFunctionSignatures = (abi: AbiItem[]) => {
        const signatures = []
        for (const entity of abi) {
            if (!(entity.type === 'function')) continue
            signatures.push({
                name: entity.name,
                // @ts-ignore
                signature: web3EthAbi.encodeFunctionSignature(entity),
            })
        }
        return signatures
    }

    const signatures1 = getFunctionSignatures(abi1)
    const signatures2 = getFunctionSignatures(abi2)

    const collisions = signatures1.filter(item1 => {
        if (signatures2.some(item2 => item2.signature === item1.signature))
            return true
        return false
    })

    return collisions
}