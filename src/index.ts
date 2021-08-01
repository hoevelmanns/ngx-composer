import build from './build'
import chalk from 'chalk'

const argv = require('yargs')
  .command('build', 'Builds the applications', {source: {description: 'directory or glob pattern to define the apps to process'}})
  .help()
  .alias('help', 'h')
  .argv

console.log(chalk.bold.hex('9F2B68').inverse(' NGX COMPOSER '), '\n')

argv._.includes('build') && build.run(argv)
