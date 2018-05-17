const path = require('path')
const TaskList = require('listr')
const chalk = require('chalk')

const { compileContracts } = require('../helpers/truffle-runner')
const { findProjectRoot } = require('../util')
const { ensureWeb3 } = require('../helpers/web3-fallback')

exports.command = 'deploy [contract]'

exports.describe = 'Deploys contract code of the app to the chain'

exports.arappContract = () => {
	const contractPath = require(path.resolve(findProjectRoot(), 'arapp.json')).path
	const contractName = path.basename(contractPath).split('.')[0]

	return contractName
}

exports.builder = yargs => {
	return yargs.positional('contract', {
		description: 'Contract name (defaults to the contract at the path in arapp.json)',
		default: exports.arappContract,
	})
}

exports.task = ({ reporter, network, cwd, contract }) => {
	const contractName = contract
	const tasks = new TaskList([
		{
			title: 'Compile contracts',
			task: async () => {
				await compileContracts()
			}
		},
		{
			title: `Deploy '${contractName}' to network`,
			task: async (ctx, task) => {
				const web3 = await ensureWeb3(network)

				let contractArtifacts
				try {
					contractArtifacts = require(path.join(cwd, 'build/contracts', contractName))
				} catch (e) {
					throw new Error('Contract artifact couldnt be found. Please ensure your contract name is the same as the filename.')
				}

				const { abi, bytecode } = contractArtifacts

				if (!bytecode || bytecode == '0x') {
					throw new Error('Contract bytecode couldnt be generated. Contracts that dont implement all interface methods cant be deployed')
				} 

				task.output = `Deploying '${contractName}' to network`

				const contract = new web3.eth.Contract(abi, { data: bytecode })
				const accounts = await web3.eth.getAccounts()
				const instance = await contract.deploy().send({ from: accounts[0], gas: 4e6 })

				if (!instance.options.address) {
					throw new Error("Contract deployment failed")
				}

				ctx.deployedContract = instance.options.address
				return ctx.deployedContract
			}
		}
	])
	return tasks.run()
}

exports.handler = async ({ reporter, network, cwd, contract }) => {
		const ctx = await exports.task({ reporter, network, cwd, contract })

    reporter.success(`Successfully deployed ${contract} at: ${chalk.bold(ctx.deployedContract)}`)
    process.exit()
}
