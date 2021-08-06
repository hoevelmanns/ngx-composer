#!/usr/bin/env node
import 'reflect-metadata'
import chalk from 'chalk'
import {bin, name} from '../package.json'

const cliName = ` ${name.replace('-', ' ').toUpperCase()} `
const cliBinName = Object.keys(bin).shift()
const yargs = require('yargs')

console.log(chalk.bold.hex('9F2B68').inverse(cliName), '\n')

yargs
    .commands(require('./commands'))
    .commands({
        command: '*',
        handler: () => yargs.showHelp()
    })
    .scriptName(cliBinName)
    .usage('$0 <cmd> [args]')
    .help()
    .argv
