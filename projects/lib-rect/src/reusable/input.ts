import { Component, ElementRef, forwardRef, Input, Output, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { BehaviorSubject, Subject } from 'rxjs'
import { Point, Element } from '../mylittledom'
import { onChange } from '../utils/reactivity'
import { KeybindService, registerKeybinds } from './keybind-service'

let globalId = 0

@Component({
  selector: 'tui-input',
  template: `<box #box>{{ text }}</box>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TuiInput),
      multi: true,
    },
  ],
})
export class TuiInput implements ControlValueAccessor {
  _id = ++globalId

  @Input() text = ''
  @Output() textChange = new BehaviorSubject(this.text)

  @ViewChild('box') boxRef: ElementRef<Element>

  // textBuffer: TextBuffer
  caretIndex = 0

  constructor(public keybindService: KeybindService) {
    this.textChange.next(this.text)
    onChange(this, 'text', value => {
      this.textChange.next(value)
      this.onChange(value)
    })

    onChange(this, 'caretIndex', value => {
      this.updateNativeCaret()
    })

    // this.textBuffer = new TextBuffer()
  }

  ngOnInit() {
    this.caretIndex = this.text.length

    const keybinds = [
      {
        keys: 'left',
        func: () => {
          this.caretIndex--
          this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
        },
      },
      {
        keys: 'right',
        func: () => {
          this.caretIndex++
          this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
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
          this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
        },
      },
      {
        /* ctrl+backspace */ keys: 'ctrl+h',
        func: () => {
          this.text = ''
          this.caretIndex = 0
        },
      },
      {
        keys: 'delete',
        func: () => {
          this.text =
            this.text.substring(0, this.caretIndex) + this.text.substring(this.caretIndex + 1)
          this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
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
            this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length)
          } else {
            return key
          }
        },
      },
    ]

    registerKeybinds(this, keybinds)
    this.keybindService.requestFocus()
  }

  ngAfterViewInit() {
    this.keybindService.requestCaret(this.boxRef.nativeElement)
    this.updateNativeCaret()
  }

  updateNativeCaret() {
    if (this.boxRef) {
      const boxNode = this.boxRef.nativeElement
      boxNode.caret = new Point({ x: this.caretIndex, y: 0 })
    }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // implements ControlValueAccessor, so a form can retrieve the value of the input

  writeValue(value: string) {
    this.text = value
    this.onChange(value)
  }

  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled
  }

  disabled: boolean
  onChange = (value: string) => {}
  onTouched = () => {}
}
