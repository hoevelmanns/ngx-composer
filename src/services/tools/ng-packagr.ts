import { autoInjectable, singleton } from 'tsyringe'
import { join } from 'path'
import execa, { ExecaReturnValue } from 'execa'

@autoInjectable()
@singleton()
export class NgPackagrService {
    private bin = join(__dirname, '../node_modules/.bin/ng-packagr')

    build = async (params: {
        cwd: string
        path?: string
        tsconfigPath?: string
        appModulePath?: string
    }): Promise<ExecaReturnValue> => {
        // todo add check if ng-packagr config exist in target workspace

        return execa(this.bin, ['-p', params.path ?? 'ng-package.json', params.tsconfigPath && '-c', params.tsconfigPath], {
            cwd: params.cwd,
        })
    }
}
