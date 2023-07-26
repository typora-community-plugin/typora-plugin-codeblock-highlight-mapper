import { Plugin, SettingTab } from '@typora-community-plugin/core'


interface LangMapperSettings {
  mapper: Record<string, string>
}

const DEFAULT_SETTINGS: LangMapperSettings = {
  mapper: {
    'dataviewjs': 'js',
    'dataview': 'sql',
  }
}

export default class LangMapperPlugin extends Plugin {

  settings: LangMapperSettings

  async onload() {
    await this.loadSettings()

    this.registerMarkdownPreProcessor({
      when: 'preload',
      type: 'code',
      process: codeblock =>
        codeblock.replace(/^(\n?\s*\`{3,})(\w+)(?=\n)/, ($, $1, lang) => {
          const { mapper } = this.settings
          return mapper[lang] ? `${$1}${mapper[lang]} ${lang}` : $
        })
    })

    this.registerMarkdownPreProcessor({
      when: 'presave',
      type: 'code',
      process: codeblock =>
        codeblock.replace(/^(\n?\s*\`{3,})(\w+) (\w+)(?=\n)/, ($, $1, lang1, lang2) => {
          const { mapper } = this.settings
          return mapper[lang2] && (lang1 === mapper[lang2]) ? `${$1}${lang2}` : $
        })
    })

    this.registerSettingTab(new LangMapperSettingTab(this))
  }

  onunload() {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

class LangMapperSettingTab extends SettingTab {

  get name() {
    return 'Codeblock Highlight Mapper'
  }

  constructor(private plugin: LangMapperPlugin) {
    super()
  }

  onload() {
    const { mapper } = this.plugin.settings

    this.addSetting(setting => {
      setting.addTable(table => {
        table
          .setHeaders([
            { title: 'Original Lang', prop: 'olang', type: 'text' },
            { title: 'Mapped Lang', prop: 'mlang', type: 'text' },
          ])
          .setData(
            Object.keys(mapper).map(k => ({
              olang: k,
              mlang: mapper[k],
            }))
          )
          .onRowChange(row => {
            if (!row.olang) return
            mapper[row.olang] = row.mlang
            this.plugin.saveSettings()
          })
          .onRowRemove(row => {
            delete mapper[row.olang]
            this.plugin.saveSettings()
          })
      })
    })
  }

}
