import _ from 'lodash'

export function percentile(array, value) {
  const originalLength = array.length
  const a = [...array]
  let alen
  const equalsValue = v => v === value

  if (!array.some(equalsValue)) {
    a.push(value)
    alen = _.range(a.length)
  } else {
    alen = _.range(a.length + 1)
  }
  const idx = array.map(equalsValue)
  const alenTrue = alen.filter(v => idx[alen.indexOf(v)])
  const meanVal = _.mean(alenTrue)
  const percent = meanVal / originalLength
  return Math.round(percent * 100) / 100
}
