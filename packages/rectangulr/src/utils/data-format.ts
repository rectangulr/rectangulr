import { Result } from './Result'
import { JsonPath } from './jsonPath'

export type Completion = {
  path: JsonPath
  values: any[]
}

export interface DataFormat {
  export(args?): Promise<any>
  check(args: { data; path?; depth?}): Promise<CheckReturn>
  completions(args?: { data?; path?; depth?}): Promise<Result<Completion[], string>>
}


export type CheckReturn = {

}
