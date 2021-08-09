import { autoInjectable } from 'tsyringe'
import { join } from 'path'
import { Argv, Ctx } from './types'
import { removeProps, transformArgOptions } from 'utils'

@autoInjectable()
export class ContextService {
  buildContext = (argv: Argv): Ctx => {
    const ctx: Ctx = {
      chunks: [],
      directory: argv.directory,
      singleBundle: argv?.singleBundle,
      concurrent: argv?.concurrent !== 'false',
      outputPath: argv?.outputPath ? join(process.cwd(), argv.outputPath) : join(process.cwd(), 'dist'),
    }

    argv.vendorChunk = argv?.vendorChunk !== 'false'
    argv.namedChunks = argv?.namedChunks !== 'false'

    ctx.ngOptions = transformArgOptions(removeProps(argv, 'exclude', 'e', 's', 'c', ...Object.keys(ctx)))

    return ctx
  }
}
