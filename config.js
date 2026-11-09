import path from 'node:path'

export function getConfig(env = process.env) {
  const stationId = env.FUEL_STATION_ID
  const dataFile = env.DATA_FILE || './data.json'

  if (!stationId || !/^\d+$/.test(stationId)) {
    throw new Error('FUEL_STATION_ID is required and must be numeric')
  }

  return {
    stationId,
    dataFile: path.resolve(dataFile),
  }
}
