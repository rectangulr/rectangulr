import { Component, ElementRef, EventEmitter, HostListener, Output, computed, forwardRef, inject, input, model } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import * as _ from '@s-libs/micro-dash'
import { combineLatestWith, debounceTime } from 'rxjs/operators'
import { Element, Point } from '../../angular-terminal/dom-terminal'
import { addStyle } from '../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../angular-terminal/logger'
import { Command, ShortcutService, registerShortcuts } from '../../commands/shortcut.service'
import { Completion, CompletionProvider } from '../../utils/CompletionProvider'
import { patchInputSignal, signal2 } from '../../utils/Signal2'
import { List } from '../2-common/list/list'
import { ListItem } from '../2-common/list/list-item'
import { HBox, VBox } from './box'
import { StyleDirective } from './style'
import { assert } from '../../utils/Assert'


let globalId = 0

@Component({
  selector: 'text-input',
  template: `
    <!-- The text to edit -->
    <h>{{ text() }}</h>

    <!-- One extra length for the caret at the end -->
    <h [s]="{ width: 1, height: 1 }"/>

    <!-- Completions hover popup -->
    @if(completionProvider() && completions().length > 0) {
      <v [s]="[{backgroundColor: 'gray', color: 'white', position: 'absolute'}, completionsSelectorPos]">
        <list [items]="completions()" (selectedItem)="completionSelected.set($event)" >
          <h *item="let completion; type: completions">{{ completion.value }}</h>
        </list>
      </v>
    }
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
  imports: [HBox, VBox, StyleDirective, List, ListItem],
})
export class TextInput implements ControlValueAccessor {
  _id = ++globalId

  readonly textInput = input('', { alias: "text" })
  readonly text = signal2('')
  @Output() textChange = new EventEmitter<string>()

  readonly multiline = input(false)
  readonly focusOnInit = input(true)

  readonly caretIndex = model(0)
  readonly domElement = signal2<Element | undefined>(undefined)
  readonly firstTextInput = signal2(true)

  // Completions
  readonly completionProvider = input<CompletionProvider | undefined>(undefined);
  readonly completions = signal2<Completion[]>([])
  readonly completionSelected = signal2<Completion | undefined>(undefined)
  readonly completionsSelectorPos = computed(() => {
    const { x, y } = fromCaretIndexToXY(this.text(), this.caretIndex())
    return { left: x, top: y + 1 }
  })

  constructor(
    public shortcutService: ShortcutService,
    public elementRef: ElementRef<Element>,
    public logger: Logger
  ) {
    addStyle({ flexDirection: 'row', scrollF: 'x', overflow: 'visible' })

    patchInputSignal(this.textInput).subscribe(value => {
      assert(typeof value == 'string')

      if (value != this.text()) {
        this.text.set(value)
        this.setCaret(value.length)
      }
      // if (this.firstTextInput) {
      //   this.firstTextInput = false
      //   this.setCaret(value.length)
      // }
    })


    // effect(() => {
    //   const value = this.text()
    //   assert(typeof value == 'string')

    //   this.textChange.next(value)
    //   this.controlValueAccessor.onChange(value)
    // })

    this.text.subscribe(value => {
      assert(typeof value == 'string')

      this.textChange.next(value)
      this.controlValueAccessor.onChange(value)
    })

    // effect(() => {
    //   this.caretIndex()
    //   untracked(() => {
    //     this.updateCaretPositionAndScroll()
    //   })
    // })

    this.caretIndex.subscribe(index => {
      this.updateCaretPositionAndScroll()
    })

    this.setCaret(this.text().length)

    registerShortcuts(this.shortcuts)

    {
      const text$ = toObservable(this.text)
      const caretIndex$ = toObservable(this.caretIndex)

      text$
        .pipe(
          combineLatestWith(caretIndex$),
          debounceTime(20),
          takeUntilDestroyed(),
        )
        .subscribe(async () => {
          const completionProvider = this.completionProvider()
          if (completionProvider) {
            this.completions.$ = (await completionProvider.completions({
              text: this.text(),
              caretIndex: this.caretIndex(),
            }))
          } else {
            this.completions.$ = []
          }
        })
    }

    inject(ShortcutService).debugDenied = true
    inject(ShortcutService).logEnabled = true
  }

  ngOnInit() {
    if (this.focusOnInit()) {
      this.shortcutService.requestFocus({ reason: 'TextInput onInit' })
    }
  }

  setCaret(value: number) {
    value = _.clamp(value, 0, this.text().length)
    this.caretIndex.set(value)
  }

  @HostListener('mousedown', ['$event'])
  onClick() {
    this.shortcutService.requestFocus({ reason: 'click' })
  }

  ngAfterViewInit() {
    this.domElement.$ = this.elementRef.nativeElement
    this.updateCaretPositionAndScroll()
    this.shortcutService.caretElement = this.domElement()
  }

  updateCaretPositionAndScroll() {
    if (this.domElement()) {
      if (this.multiline()) {
        const { x, y } = fromCaretIndexToXY(this.text(), this.caretIndex())
        this.domElement().caret = new Point({ x, y })
      } else {
        this.domElement().caret = new Point({ x: this.caretIndex(), y: 0 })
      }
      this.domElement().scrollCellIntoView(this.domElement().caret)
    }
  }

  toString() {
    return `TextInput: '${this.text()}'`
  }

  // implements ControlValueAccessor, so a form can read/write the value of this input
  //#region ControlValueAccessor

  controlValueAccessor = {
    disabled: false,
    onChange: (value: string) => { },
    onTouched: () => { },
  }

  writeValue(value: string) {
    this.text.$ = value
    this.setCaret(_.clamp(this.caretIndex(), 0, this.text().length))
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
        if (this.caretIndex() == 0) return key
        this.caretIndex.update(v => --v)
      },
    },
    {
      keys: 'right',
      func: key => {
        if (this.caretIndex() == this.text().length) return key
        this.caretIndex.update(v => ++v)
      },
    },
    {
      keys: 'down',
      func: key => {
        if (this.multiline() == false) {
          return key
        }
        let i = this.caretIndex()
        for (; true; i++) {
          if (i >= this.text().length) {
            return key
          }
          if (this.text()[i] == "\n") {
            this.setCaret(i + 1)
            break
          }
        }
      },
    },
    {
      keys: 'up',
      func: key => {
        if (this.multiline() == false) {
          return key
        }
        let i = this.caretIndex()
        for (; true; i--) {
          if (i <= 0) {
            return key
          }
          if (this.text()[i] == "\n") {
            this.setCaret(i - 1)
            break
          }
        }
      },
    },
    {
      keys: 'home',
      func: key => {
        if (this.caretIndex() == 0) return key
        this.setCaret(0)
      },
    },
    {
      keys: 'end',
      func: key => {
        if (this.caretIndex() == this.text().length) return key
        this.setCaret(this.text().length)
      },
    },
    {
      keys: 'backspace',
      func: key => {
        if (this.caretIndex() == 0) return key
        this.text.$ = this.text().substring(0, this.caretIndex() - 1) + this.text().substring(this.caretIndex())
        this.caretIndex.update(v => --v)
      },
    },
    {
      keys: 'ctrl+left',
      func: key => {
        if (this.caretIndex() == 0) return key
        this.setCaret(searchFromIndex(this.text(), this.caretIndex(), -1))
      },
    },
    {
      keys: 'ctrl+u',
      func: () => {
        this.text.$ = ''
        this.setCaret(0)
      },
    },
    {
      keys: 'ctrl+right',
      func: key => {
        if (this.caretIndex() == this.text().length) return key
        this.setCaret(searchFromIndex(this.text(), this.caretIndex(), +1))
      },
    },
    {
      keys: ['ctrl+h', 'ctrl+w', 'ctrl+backspace'],
      func: key => {
        if (this.caretIndex() == 0) return key
        const index = searchFromIndex(this.text(), this.caretIndex(), -1)
        this.text.$ = this.text().substring(0, index) + this.text().substring(this.caretIndex(), this.text().length)
        this.setCaret(index)
      },
    },
    {
      keys: 'delete',
      func: () => {
        this.text.$ = this.text().substring(0, this.caretIndex()) + this.text().substring(this.caretIndex() + 1)
      },
    },
    {
      id: 'selectCompletion',
      keys: 'tab',
      func: key => {
        if (this.completionProvider() === undefined) return key
        if (!this.completionSelected()) return key
        const completion = this.completionSelected()
        const toBeInserted = completion?.textToInsert ?? completion?.value
        this.text.$ = this.text().slice(0, this.caretIndex())
          + toBeInserted
          + this.text().slice(this.caretIndex())
        this.caretIndex.update(c => c + toBeInserted.length)
      }
    },
    {
      keys: 'else',
      func: key => {
        if (!key.shift && !key.ctrl && !key.alt && !key.meta) {
          if (key.name.length == 1) {
            insertString(this, key.name)
            return
          } else {
            if (key.name == 'enter') {
              if (this.multiline()) {
                insertString(this, "\n")
                return
              }
            }
          }
        }
        return key

        function insertString(textInput: TextInput, str: string) {
          textInput.text.$ = textInput.text().substring(0, textInput.caretIndex()) + str + textInput.text().substring(textInput.caretIndex())
          textInput.caretIndex.update(c => c + str.length)
        }
      }
    },
  ]
}

const fromCaretIndexToXYCache = { text: undefined, caretIndex: undefined, result: undefined }

function fromCaretIndexToXY(text: string, caretIndex: number) {
  if (fromCaretIndexToXYCache.text === text && fromCaretIndexToXYCache.caretIndex == caretIndex) {
    return fromCaretIndexToXYCache.result
  }
  let x = 0
  let y = 0
  for (let i = 0; i < caretIndex; i++) {
    if (text[i] == '\n') {
      y++
      x = 0
    } else {
      x++
    }
  }
  const result = { x, y }
  fromCaretIndexToXYCache.text = text
  fromCaretIndexToXYCache.caretIndex = caretIndex
  fromCaretIndexToXYCache.result = result
  return result
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
  characters = ` \n\t\`~!@#$%^&*()-=+[{]}\|;:'",.<>/?`
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
