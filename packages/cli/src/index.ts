#!/usr/bin/env node
import 'reflect-metadata'
import chalk from 'chalk'
import { bin, name, version } from '../package.json'

const cliName = `${name
    .replace(/[^a-z0-9- ]/g, ' ')
    .trim()
    .toUpperCase()}`
const cliBinName = Object.keys(bin).shift()
const yargs = require('yargs')

console.log(chalk.bold.whiteBright(`\n${cliName} ${version}\n`))

import('./commands').then(
    commands =>
        Object.entries(commands.default).map(command => yargs.command(command.pop())) &&
        yargs
            .parserConfiguration({
                'strip-aliased': true,
                'duplicate-arguments-array': false,
            })
            .commands({ command: '*', handler: () => yargs.showHelp() })
            .scriptName(cliBinName ?? 'NGX Composer')
            .usage(`$0 <cmd> [args]`)
            .wrap(Math.min(90, yargs.terminalWidth()))
            .updateStrings({
                'Commands:': chalk.cyan('Commands:'),
                'Options:': chalk.cyan('Flags:'),
            })
            .help().argv
)
