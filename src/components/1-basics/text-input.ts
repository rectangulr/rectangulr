import { Component, ElementRef, EventEmitter, forwardRef, Input, Output } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Element, Point } from '../../angular-terminal/dom-terminal'
import { registerShortcuts, ShortcutService } from '../../commands/shortcut.service'
import { onChange } from '../../utils/reactivity'
import { Box } from './box'

let globalId = 0

@Component({
  standalone: true,
  imports: [Box],
  selector: 'text-input',
  host: { '[style]': "{ flexDirection: 'row' }" },
  template: `
    <box>{{ text }}</box>
    <box [style]="{ width: 1, height: 1 }"></box>
  `,
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
  @Output() textChange = new EventEmitter<string>()

  caretIndex = 0
  // @ViewChild('box', { read: Element }) boxRef: Element
  domElement: Element

  constructor(public shortcutService: ShortcutService, public elementRef: ElementRef<Element>) {}

  ngOnInit() {
    onChange(this, 'text', value => {
      this.textChange.next(value)
      this.ControlValueAccessorData.onChange(value)
    })

    onChange(
      this,
      'caretIndex',
      () => this.updateCaretPositionAndScroll(),
      value => _.clamp(value, 0, this.text.length)
    )
    this.caretIndex = this.text.length

    registerShortcuts(this, this.shortcuts)
    this.shortcutService.requestFocus()
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

  shortcuts = [
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
