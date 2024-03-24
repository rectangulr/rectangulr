import { Component, effect, ElementRef, forwardRef, HostListener, Input, model } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { Element, Point } from '../../angular-terminal/dom-terminal'
import { addStyle } from '../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../angular-terminal/logger'
import { Command, registerShortcuts, ShortcutService } from '../../commands/shortcut.service'
import { onChange } from '../../utils/reactivity'
import { assert } from '../../utils/utils'
import { GrowDirective, HBox } from './box'
import { StyleDirective } from './style'

let globalId = 0

@Component({
  selector: 'text-input',
  template: `
    <h>{{ text() }}</h>
    <h [s]="{ width: 1, height: 1 }"/>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
    { provide: ShortcutService },
  ],
  standalone: true,
  imports: [HBox, StyleDirective, GrowDirective],
})
export class TextInput implements ControlValueAccessor {
  _id = ++globalId

  text = model('')
  @Input() focusOnInit = true

  caretIndex = 0
  domElement: Element

  constructor(
    public shortcutService: ShortcutService,
    public elementRef: ElementRef<Element>,
    public logger: Logger
  ) {
    addStyle({ flexDirection: 'row', scrollF: 'x' })
    effect(() => {
      const value = this.text()
      assert(typeof value == 'string')

      // this.textChange.next(value)
      this.controlValueAccessor.onChange(value)
    })
    registerShortcuts(this.shortcuts)
  }

  ngOnInit() {
    assert(typeof this.text() == 'string')

    onChange(
      this,
      'caretIndex',
      () => this.updateCaretPositionAndScroll(),
      value => _.clamp(value, 0, this.text().length)
    )
    this.caretIndex = this.text().length

    if (this.focusOnInit) {
      this.shortcutService.requestFocus({ reason: 'TextInput onInit' })
    }
  }

  @HostListener('mousedown', ['$event'])
  onClick() {
    this.shortcutService.requestFocus({ reason: 'click' })
  }

  ngAfterViewInit() {
    this.domElement = this.elementRef.nativeElement
    this.updateCaretPositionAndScroll()
    this.shortcutService.caretElement = this.domElement
  }

  updateCaretPositionAndScroll() {
    if (this.domElement) {
      this.domElement.caret = new Point({ x: this.caretIndex, y: 0 })
      this.domElement.scrollCellIntoView(this.domElement.caret)
    }
  }

  toString() {
    return `TextInput: '${this.text()}'`
  }

  // implements ControlValueAccessor, so a form can read/write the value of this input

  controlValueAccessor = {
    disabled: false,
    onChange: (value: string) => { },
    onTouched: () => { },
  }

  writeValue(value: string) {
    this.text.set(value)
    this.caretIndex = _.clamp(this.caretIndex, 0, this.text().length)
    this.controlValueAccessor.onChange(value)
  }

  registerOnChange(fn: (value: string) => void) {
    this.controlValueAccessor.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.controlValueAccessor.onTouched = fn
  }

  setDisabledState(disabled: boolean) {
    this.controlValueAccessor.disabled = disabled
  }

  //#endregion ControlValueAccessor

  shortcuts: Partial<Command>[] = [
    {
      keys: 'left',
      func: key => {
        if (this.caretIndex == 0) return key
        this.caretIndex--
      },
    },
    {
      keys: 'right',
      func: key => {
        if (this.caretIndex == this.text().length) return key
        this.caretIndex++
      },
    },
    {
      keys: 'home',
      func: key => {
        if (this.caretIndex == 0) return key
        this.caretIndex = 0
      },
    },
    {
      keys: 'end',
      func: key => {
        if (this.caretIndex == this.text().length) return key
        this.caretIndex = this.text().length
      },
    },
    {
      keys: 'backspace',
      func: key => {
        if (this.caretIndex == 0) return key
        this.text.set(this.text().substring(0, this.caretIndex - 1) + this.text().substring(this.caretIndex))
        this.caretIndex--
      },
    },
    {
      keys: 'ctrl+left',
      func: key => {
        if (this.caretIndex == 0) return key
        this.caretIndex = searchFromIndex(this.text(), this.caretIndex, -1)
      },
    },
    {
      keys: 'ctrl+u',
      func: () => {
        this.text.set('')
        this.caretIndex = 0
      },
    },
    {
      keys: 'ctrl+right',
      func: key => {
        if (this.caretIndex == this.text().length) return key
        this.caretIndex = searchFromIndex(this.text(), this.caretIndex, +1)
      },
    },
    {
      keys: ['ctrl+h', 'ctrl+w', 'ctrl+backspace'],
      func: key => {
        if (this.caretIndex == 0) return key
        const index = searchFromIndex(this.text(), this.caretIndex, -1)
        this.text.set(this.text().substring(0, index) + this.text().substring(this.caretIndex, this.text().length))
        this.caretIndex = index
      },
    },
    {
      keys: 'delete',
      func: () => {
        this.text.set(this.text().substring(0, this.caretIndex) + this.text().substring(this.caretIndex + 1))
      },
    },
    {
      keys: 'else',
      func: key => {
        if (!key.shift && !key.ctrl && !key.alt && !key.meta && key.name.length == 1) {
          this.text.set(this.text().substring(0, this.caretIndex) + key.name + this.text().substring(this.caretIndex))
          this.caretIndex++
        } else {
          return key
        }
      },
    },
  ]
}

/**
 * Used to jump around the text with 'ctrl+left' and 'ctrl+right'.
 * Determines the index to jump to. According to the start index, the direction (incrementBy)
 * and a list of characters that break the jump.
 */
function searchFromIndex(
  text: string,
  startIndex: number,
  incrementBy = 1,
  characters = ` \t\`~!@#$%^&*()-=+[{]}\|;:'",.<>/?`
) {
  let index = startIndex + incrementBy
  if (characters.includes(text[index])) {
    index += incrementBy
  }
  while (true) {
    if (index <= 0 || index >= text.length) {
      return index
    } else if (characters.includes(text[index])) {
      if (incrementBy == 1) {
        return index
      } else {
        index -= incrementBy
        return index
      }
    } else {
      index += incrementBy
    }
  }
}
