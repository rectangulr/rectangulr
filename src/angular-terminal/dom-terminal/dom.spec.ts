import { Component, ElementRef, ViewChild } from '@angular/core'
import { HBox, GrowDirective, VBox } from '../../components/1-basics/box'
import { setupTest } from '../../utils/tests'
import { Element } from './sources'
import { StyleDirective } from '../../public-api'
import Yoga from 'typeflex'

describe('DOM - ', () => {
  it('child should be bigger than parent', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, GrowDirective],
      template: `
        <v #parent [style]="{ width: 5 }">
          <v #child [style]="{ flexShrink: 0 }">aaaaaaaaaa</v>
        </v>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child') child: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child = component.child.nativeElement
    const text = child.childNodes[0]

    expect(parent.yogaNode.getComputedWidth()).toEqual(5)
    expect(child.getInternalContentWidth()).toEqual(10)
    expect(child.yogaNode.getComputedWidth()).toEqual(10)
  })

  it('text should stretch the parent', async () => {
    @Component({
      standalone: true,
      imports: [GrowDirective, VBox],
      template: ` <v #parent>aaaaaaaaaa</v> `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const text = parent.childNodes[0]

    expect(parent.yogaNode.getComputedWidth()).toEqual(10)
  })

  it('<v>', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, GrowDirective, StyleDirective],
      template: `
        <v [style]="{ width: 20 }">
          <v #child1>Test</v>
          <v #child2>Test2</v>
        </v>
      `,
    })
    class Test {
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const child1 = component.child1.nativeElement
    const child2 = component.child2.nativeElement

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(5)
  })

  it('v hgrow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, GrowDirective, StyleDirective],
      template: `
        <v #parent [style]="{ width: 20 }">
          <v #child1 [style]="{ hgrow: true }">Test</v>
          <v #child2 [style]="{ hgrow: true }">Test2</v>
        </v>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child1 = component.child1.nativeElement
    const child2 = component.child2.nativeElement

    expect(parent.yogaNode.getComputedLayout().width).toEqual(20)
    expect(parent.yogaNode.getAlignItems()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getAlignContent()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getFlexDirection()).toEqual(Yoga.FLEX_DIRECTION_COLUMN)

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(20)
  })

  it('hbox vgrow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, StyleDirective],
      template: `
        <h #parent [style]="{ height: 20 }">
          <v #child1 [style]="{ vgrow: true }">Test</v>
          <v #child2 [style]="{ vgrow: true }">Test2</v>
        </h>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    const parent = component.parent.nativeElement
    expect(parent.yogaNode.getComputedLayout().height).toEqual(20)
    expect(parent.yogaNode.getAlignItems()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getAlignContent()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getFlexDirection()).toEqual(Yoga.FLEX_DIRECTION_ROW)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().left).toEqual(0)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
    expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)

    const child2 = component.child2.nativeElement
    expect(child2.yogaNode.getComputedLayout().left).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().height).toEqual(20)
    expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)
  })

  it('hbox grow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, StyleDirective, GrowDirective],
      template: `
        <h #parent [style]="{ height: 20, width: 20 }">
          <h grow #child1></h>
        </h>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    // const parent = component.parent.nativeElement
    // expect(parent.yogaNode.getComputedLayout().width).toEqual(20)
    // expect(parent.yogaNode.getComputedLayout().height).toEqual(20)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
  })
})
