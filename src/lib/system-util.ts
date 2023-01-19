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
    return writeTextFile(path, contents)
  }

  async readFile(path: string): Promise<string> {
    return readTextFile(path)
  }

  async openFileDialog(
    filters: DialogFilter[] = []
  ): Promise<null | string | string[]> {
    return open({ filters })
  }

  async saveFileDialog(filters: DialogFilter[] = []): Promise<null | string> {
    return save({ filters })
  }
}
