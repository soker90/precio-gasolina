import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getConfig } from './config.js'
import { fetchStationPrices } from './geoportal.js'
import { getTodayDate, getTodayISODate, updatePriceHistory, validatePriceHistory } from './price-history.js'

/** Reads a station's saved history and validates its structure before updating it. */
async function readHistory(file) {
  let content
  try {
    content = await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Historical file not found: ${file}`, { cause: error })
    }
    throw error
  }

  let history
  try {
    history = JSON.parse(content)
  } catch (error) {
    throw new Error(`Historical file contains invalid JSON: ${file}`, { cause: error })
  }

  return validatePriceHistory(history, file)
}

/** Persists JSON through a temporary file so interrupted writes cannot corrupt the history. */
async function writeJsonAtomically(file, data) {
  const temporaryFile = `${file}.tmp`
  await writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(temporaryFile, file)
}

async function main() {
  const { stationId, dataFile } = getConfig()
  const { gasoline, diesel } = await fetchStationPrices({ stationId })
  const history = await readHistory(dataFile)
  const { history: updatedHistory, previous } = updatePriceHistory(
    history,
    getTodayDate(),
    { gasoline, diesel },
  )

  await mkdir(path.dirname(dataFile), { recursive: true })

  const previousFile = path.join(path.dirname(dataFile), `previous-${path.basename(dataFile)}`)
  if (previous) {
    await writeJsonAtomically(previousFile, previous)
  } else {
    await rm(previousFile, { force: true })
  }

  updatedHistory.updatedAt = getTodayISODate()
  await writeJsonAtomically(dataFile, updatedHistory)
  console.log(
    `Saved ${getTodayDate()}: gasoline ${gasoline} €/L, diesel ${diesel} €/L (station ${stationId})`,
  )
}

main().catch(error => {
  console.error('Price update failed:', error)
  process.exitCode = 1
})
