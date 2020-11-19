import Rollbar from 'rollbar'
const RollbarErrorTracking = (() => {
  const RollbarObj = new Rollbar({
    accessToken: "ROLLBAR_API_KEY",
    captureUncaught: true,
    captureUnhandledRejections: true,
  })
  const logErrorInfo = (info: any) => {
    RollbarObj.info(info)
  }
  const logErrorInRollbar = (error: any) => {
    RollbarObj.error(error)
  }
  return { logErrorInfo, logErrorInRollbar }
})()
export default RollbarErrorTracking
