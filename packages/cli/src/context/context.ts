import { autoInjectable } from 'tsyringe'
import { Argv, Ctx } from './types'
import { removeProps, TransformArgOptions, transformArgOptions } from 'utils'
import { makeAbsolute } from 'fast-glob/out/utils/path'

@autoInjectable()
export class Context {
    buildContext = (argv: Argv, builder = <Argv>{}, ...excludeArgs): Ctx => {
        const { directory, singleBundle, concurrent, outputPath, loaderFileName, createLoaderFile } = argv
        const ctx: Ctx = {
            chunks: [],
            directory,
            singleBundle,
            concurrent,
            outputPath: makeAbsolute(process.cwd(), outputPath ?? 'dist'),
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
