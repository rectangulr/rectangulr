/**
 * Used by json-editor to know what part of the json to focus on.
 * Example: {root: {name: 'aa}}
 * JsonPath = ['root','name', 2] would position the caret after 'aa'
 */
export type JsonPath = Array<string | number>

export type Completion = {
  path: JsonPath
  values: any[]
}

export interface DataFormat {
  export(args?): Promise<any>
  check(args: { data; path?; depth?}): Promise<CheckReturn>
  completions(args?: { data?; path?; depth?}): Promise<Completion[]>
}


export type CheckReturn = {

}
