import { open, save } from "@tauri-apps/api/dialog"
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs"

// TODO: Consider moving SystemUtil and Window interfaces into a "Platform"
// container/superclass
export interface SystemUtil {
  openFileDialog(filters?: DialogFilter[]): Promise<null | string | string[]>
  saveFileDialog(filters?: DialogFilter[]): Promise<null | string>
  readFile(path: string): Promise<string>
  writeFile(path: string, contents: string): Promise<void>
}

export type DialogFilter = {
  name: string
  extensions: string[]
}

export class TauriSystemUtil implements SystemUtil {
  static FILTER_NAME = "ViengineTauriFilter"
  async writeFile(path: string, contents: string): Promise<void> {
    const result = await writeTextFile(path, contents)
    return result
  }

  async readFile(path: string): Promise<string> {
    const result = await readTextFile(path)
    return result
  }

  async openFileDialog(
    filters: DialogFilter[] = []
  ): Promise<null | string | string[]> {
    const result = await open({ filters })
    return result
  }

  async saveFileDialog(filters: DialogFilter[] = []): Promise<null | string> {
    const result = await save({ filters })
    return result
  }
}
