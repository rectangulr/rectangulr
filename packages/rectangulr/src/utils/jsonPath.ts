/**
 * Used by json-editor to know what part of the json to focus on.
 * Example: {root: {name: 'aa}}
 * JsonPath = ['root','name', 2] would position the caret after 'aa'
 */
export type JsonPath = Array<string | number | null>
