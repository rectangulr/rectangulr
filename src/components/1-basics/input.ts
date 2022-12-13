import { Component, ElementRef, forwardRef, Input, Output, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { BehaviorSubject, Subject } from 'rxjs'
import { ShortcutService, registerCommands } from '../../commands/shortcut.service'
import { Element, Point } from '../../angular-terminal/dom-terminal'
import { onChange } from '../../utils/reactivity'

let globalId = 0

@Component({
  selector: 'text-input',
  template: ` <box #box>{{ text }}</box> `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
    { provide: ShortcutService },
  ],
})
export class TextInput implements ControlValueAccessor {
  _id = ++globalId

  @Input() text = ''
  @Output() textChange = new BehaviorSubject(this.text)

  caretIndex = 0
  @ViewChild('box') boxRef: ElementRef<Element>
  termTextRef: Element

  constructor(public shortcutService: ShortcutService) {
    onChange(this, 'text', value => {
      this.textChange.next(value)
      this.ControlValueAccessorData.onChange(value)
    })

    onChange(
      this,
      'caretIndex',
      value => this.updateNativeCaret(),
      value => _.clamp(value, 0, this.text.length)
    )
  }

  ngOnInit() {
    this.caretIndex = this.text.length

    const keybinds = [
      {
        keys: 'left',
        func: () => {
          this.caretIndex--
        },
      },
      {
        keys: 'right',
        func: () => {
          this.caretIndex++
        },
      },
      {
        keys: 'home',
        func: () => {
          this.caretIndex = 0
        },
      },
      {
        keys: 'end',
        func: () => {
          this.caretIndex = this.text.length
        },
      },
      {
        keys: 'backspace',
        func: () => {
          this.text =
            this.text.substring(0, this.caretIndex - 1) + this.text.substring(this.caretIndex)
          this.caretIndex--
        },
      },
      {
        keys: 'ctrl+left',
        func: () => {
          this.caretIndex = searchFromIndex(this.text, this.caretIndex, -1)
        },
      },
      {
        keys: 'ctrl+u',
        func: () => {
          this.text = ''
          this.caretIndex = 0
        },
      },
      {
        keys: 'ctrl+right',
        func: () => {
          this.caretIndex = searchFromIndex(this.text, this.caretIndex, +1)
        },
      },
      {
        /* ctrl+backspace */ keys: ['ctrl+h', 'ctrl+w'],
        func: () => {
          const index = searchFromIndex(this.text, this.caretIndex, -1)
          this.text =
            this.text.substring(0, index) + this.text.substring(this.caretIndex, this.text.length)
          this.caretIndex = index
        },
      },
      {
        keys: 'delete',
        func: () => {
          this.text =
            this.text.substring(0, this.caretIndex) + this.text.substring(this.caretIndex + 1)
        },
      },
      {
        keys: 'else',
        func: key => {
          if (!key.shift && !key.ctrl && !key.alt && !key.meta && key.name.length == 1) {
            this.text =
              this.text.substring(0, this.caretIndex) +
              key.name +
              this.text.substring(this.caretIndex)
            this.caretIndex++
          } else {
            return key
          }
        },
      },
    ]

    registerCommands(this, keybinds)
    this.shortcutService.focus()
  }

  ngAfterViewInit() {
    this.termTextRef = this.boxRef.nativeElement.childNodes[0]
    this.updateNativeCaret()
    this.shortcutService.requestCaret(this.termTextRef)
  }

  updateNativeCaret() {
    if (this.termTextRef) {
      this.termTextRef.caret = new Point({ x: this.caretIndex, y: 0 })
      this.termTextRef.scrollCellIntoView(this.termTextRef.caret)
    }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.shortcutService.unfocus()
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  // implements ControlValueAccessor, so a form can read/write the value of this input

  writeValue(value: string) {
    this.text = value
    this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
    this.ControlValueAccessorData.onChange(value)
  }

  registerOnChange(fn: (value: string) => void) {
    this.ControlValueAccessorData.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.ControlValueAccessorData.onTouched = fn
  }

  setDisabledState(disabled: boolean) {
    this.ControlValueAccessorData.disabled = disabled
  }

  ControlValueAccessorData = {
    disabled: false,
    onChange: (value: string) => {},
    onTouched: () => {},
  }
}

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
