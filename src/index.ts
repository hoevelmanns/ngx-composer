#!/usr/bin/env node
import 'reflect-metadata'
import chalk from 'chalk'
import { bin, name, version } from '../package.json'

const cliName = `${name.replace('-', ' ').toUpperCase()}`
const cliBinName = Object.keys(bin).shift()
const yargs = require('yargs')

console.log(chalk.bold.whiteBright(`\n${cliName}\n`))

import('./commands').then(
    commands =>
        Object.entries(commands.default).map(command => yargs.command(command.pop())) &&
        yargs
            .commands({ command: '*', handler: () => yargs.showHelp() })
            .scriptName(cliBinName)
            .usage(`$0 <cmd> [args]`)
            .version(version)
            .help().argv
)
