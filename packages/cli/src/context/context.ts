import { autoInjectable } from 'tsyringe'
import { join } from 'path'
import { Argv, Ctx } from './types'
import { removeProps, TransformArgOptions, transformArgOptions } from 'utils'

@autoInjectable()
export class ContextService {
    buildContext = (argv: Argv, builder = <Argv>{}, ...excludeArgs): Ctx => {
        const { directory, singleBundle, concurrent, outputPath, loaderFileName, createLoaderFile } = argv
        const ctx: Ctx = {
            chunks: [],
            directory,
            singleBundle,
            concurrent,
            outputPath: outputPath ? outputPath : join(process.cwd(), 'dist'),
            loaderFileName,
            createLoaderFile,
            ngOptions: <TransformArgOptions>{},
        }

        const alias = Object.entries(builder).map(([_, val]) => val['alias'])

        const ngOptions = removeProps(argv, 'exclude', ...alias, ...excludeArgs, ...Object.keys(ctx))

        ctx.ngOptions = transformArgOptions(ngOptions)

        return ctx
    }
}
