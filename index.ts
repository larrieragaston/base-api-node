import config from 'config'
import logger from './logger'
import BaseApi from './lib/baseApi'

const baseApi = new BaseApi(config, logger)
baseApi.BaseApi = BaseApi

export default baseApi
