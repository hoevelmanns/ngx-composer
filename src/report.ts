import chalk from 'chalk'
import {getBorderCharacters, table} from 'table'
import {Workspace} from "./services/tree/workspace"

export class Report {

    /**
     * @deprecated
     * @todo rename method to "showResults" and reuse the table
     * @param workspaces
     */
    listWorkspaces(workspaces: Workspace[]): void {
        console.log(chalk.bold.whiteBright(`Found ${workspaces.length} angular ` + (workspaces.length > 1 ? 'workspaces' : 'workspace')), '\n')

        const info = [
            [chalk.bold.whiteBright('Workspace Directory'), '|', chalk.bold.whiteBright('Default Project')]
        ]

        workspaces.map(w => info.push([w.config.dir, '|', chalk.cyan(w.defaultProject.projectName)]))

        this.outputTable(info)
    }

    private outputTable = (data: string[][], drawHorizontalLines?: boolean) =>
        console.log(chalk.white(table(data, {
            border: getBorderCharacters('void'),
            columnDefault: {paddingLeft: 0, paddingRight: 2},
            drawHorizontalLine: () => drawHorizontalLines
        })))
}
