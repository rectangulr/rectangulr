export interface DataFormat {
  export(args?): Promise<any>
  check(args: { data; path?; depth? }): Promise<any>
  expand(args?: { data?; path?; depth? }): Promise<{ key: string; value: any }[]>
}
