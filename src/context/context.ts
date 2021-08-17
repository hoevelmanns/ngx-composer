import { autoInjectable } from 'tsyringe'
import { join } from 'path'
import { Argv, Ctx } from './types'
import { removeProps, transformArgOptions } from 'utils'

@autoInjectable()
export class ContextService {
    buildContext = (argv: Argv, builder = <Argv>{}, ...excludeArgs): Ctx => {
        const { directory, singleBundle, concurrent, outputPath } = argv
        const ctx: Ctx = {
            chunks: [],
            directory,
            singleBundle: singleBundle !== 'false',
            concurrent: concurrent !== 'false',
            outputPath: outputPath ? join(process.cwd(), outputPath) : join(process.cwd(), 'dist'),
        }

        const alias = Object.entries(builder).map(([_, val]) => val['alias'])

        const ngOptions = removeProps(argv, 'exclude', ...alias, ...excludeArgs, ...Object.keys(ctx))

        ctx.ngOptions = transformArgOptions(ngOptions)

        return ctx
    }
}
