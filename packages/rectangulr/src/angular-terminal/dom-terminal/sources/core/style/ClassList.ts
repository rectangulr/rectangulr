import { StyleManager } from './StyleManager'

export class ClassList {
  styleManager: StyleManager

  constructor(styleManager) {
    this.styleManager = styleManager
  }

  assign(rulesets) {
    this.styleManager.setRulesets(new Set(rulesets))
  }

  add(ruleset) {
    this.styleManager.addRuleset(ruleset)
  }

  remove(ruleset) {
    this.styleManager.removeRuleset(ruleset)
  }

  // toggle(ruleset, force) {
  //   if (_.isUndefined(force)) force = !this.includes(ruleset)

  //   if (force) {
  //     this.add(ruleset)
  //   } else {
  //     this.remove(ruleset)
  //   }
  // }

  // contains() {
  //   throw new Error(`Failed to execute 'contains': Use 'includes' instead.`)
  // }

  // includes(ruleset) {
  //   return this.styleManager.hasRuleset(ruleset)
  // }
}
