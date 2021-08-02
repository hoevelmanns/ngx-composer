import chalk from 'chalk'
import {Target} from "./targets/types"
import {build} from "./targets/build"

export type Targets = Target[]

const yargs = require('yargs')

const targets: Targets = [
    build(yargs)
    // todo merge plugins from config
]

console.log(chalk.bold.hex('9F2B68').inverse(' NGX COMPOSER '), '\n')

yargs.help().argv

targets.map(t => t.init())
