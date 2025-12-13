import type { SettingsType } from '../types/settings'

export const getSettings = async () => {
  try {
    const settings = await Bun.file('./src/projectSettings.example.json').text()
    return JSON.parse(settings) as SettingsType
  } catch (e) {
    console.error(`Error reading settings file: ${e}`)
  }
}
