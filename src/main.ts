import { getCodeMirrorMode } from 'typora'
import { Plugin, PluginSettings, SettingTab, decorate } from '@typora-community-plugin/core'


interface LangMapperSettings {
  mapper: Record<string, string>
}

const DEFAULT_SETTINGS: LangMapperSettings = {
  mapper: {
    'dataviewjs': 'js',
    'dataview': 'sql',
    'markmap': 'markdown',
  }
}

export default class LangMapperPlugin extends Plugin<LangMapperSettings> {

  async onload() {
    this.registerSettings(
      new PluginSettings(this.app, this.manifest, {
        version: 1,
      }))

    this.settings.setDefault(DEFAULT_SETTINGS)

    this.register(
      decorate(window as any, 'getCodeMirrorMode', (fn: typeof getCodeMirrorMode) => (lang: string) => {
        const mapper = this.settings.get('mapper')
        const lang2 = mapper[lang]
        return fn(lang2)
      }))

    this.registerSettingTab(new LangMapperSettingTab(this))
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
    const mapper = this.plugin.settings.get('mapper')

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
            this.plugin.settings.set('mapper', mapper)
          })
          .onRowRemove(row => {
            delete mapper[row.olang]
            this.plugin.settings.set('mapper', mapper)
          })
      })
    })
  }

}
