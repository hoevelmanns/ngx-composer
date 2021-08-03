#!/usr/bin/env node
import chalk from 'chalk'
import {bin, name} from '../package.json'

const cliName = ` ${name.replace('-', ' ').toUpperCase()} `
const cliBinName = Object.keys(bin).shift()

console.log(chalk.bold.hex('9F2B68').inverse(cliName), '\n')

require('yargs')
    .commands(require('./targets'))
    .scriptName(cliBinName)
    .usage('$0 <cmd> [args]')
    .help()
    .argv
